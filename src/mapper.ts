import path from 'path';
import ts from 'typescript';
import { getModuleSpecifier, isNamedDeclaration } from './tsutil';
import {
  defaultLibraryRewrites,
  globalRewrites,
  libraryRewrites,
  TypeRewrite,
  NamespaceRewrite,
} from './rewrite';
import { assertUnreachable } from './generics';
import { formatSyntaxKind } from './tsdebug';

/*
 * See docs/notes/mapper.md for some scratch notes on the background
 * and architecture of this.
 */

export interface Mapper {
  /** (Yes, this API can only work for absolute imports.  For now this only
   * supports our static rewrite rules anyway.) */
  getModule(moduleSpecifier: string): void | NamespaceRewrite;

  /** (Each call to this in the converter should have a corresponding case
   * in the visitor in `createMapper`, to ensure that we find and
   * investigate that symbol.) */
  getSymbolAsType(symbol: ts.Symbol): void | TypeRewrite;

  /** (Each call to this in the converter should have a corresponding case
   * in the visitor in `createMapper`, to ensure that we find and
   * investigate that symbol.) */
  getTypeName(
    typeName: ts.EntityNameOrEntityNameExpression,
  ): void | TypeRewrite;
}

export function createMapper(program: ts.Program, targetFilenames: string[]) {
  const targetSet = new Set(targetFilenames.map((f) => path.resolve(f)));
  const checker = program.getTypeChecker();
  const seenSymbols: Set<ts.Symbol> = new Set();
  let hadRenames = false;

  // In TypeScript, a given name in a given scope may refer to a value, a
  // type, a namespace, or any combination, and the same name's bindings of
  // the three different kinds may have nothing to do with one another.
  // We keep separate maps for how to rewrite the symbol when it appears as
  // a type or as a namespace.  (And we don't rewrite value references.)
  const symbolTypeRewrites: Map<ts.Symbol, TypeRewrite> = new Map();
  const symbolNamespaceRewrites: Map<ts.Symbol, NamespaceRewrite> = new Map();

  const mapper: Mapper = {
    getModule: (specifier) => libraryRewrites.get(specifier),
    getSymbolAsType: (symbol) => symbolTypeRewrites.get(symbol),
    getTypeName,
  };

  initMapper();

  seenSymbols.clear();
  targetSet.clear();

  return mapper;

  function getTypeName(node: ts.EntityNameOrEntityNameExpression) {
    const symbol = checker.getSymbolAtLocation(node);
    const mapped = symbol && symbolTypeRewrites.get(symbol);
    if (mapped) return mapped;

    if (ts.isIdentifier(node)) return undefined;
    const qualifier = ts.isQualifiedName(node) ? node.left : node.expression;
    const name = ts.isQualifiedName(node) ? node.right.text : node.name.text;
    const qualifierSymbol = checker.getSymbolAtLocation(qualifier);
    return (
      qualifierSymbol &&
      symbolNamespaceRewrites.get(qualifierSymbol)?.types?.get(name)
    );
  }

  function initMapper() {
    const sourceFiles = program.getSourceFiles();

    const defaultLibraryFiles = [];
    const targetFiles = [];
    for (const sourceFile of sourceFiles) {
      const isTarget = targetSet.has(path.resolve(sourceFile.fileName));
      if (program.isSourceFileDefaultLibrary(sourceFile)) {
        defaultLibraryFiles.push(sourceFile);
        if (isTarget) {
          warn(`attempted to target default library: ${sourceFile.fileName}`);
        }
      } else if (isTarget) {
        targetFiles.push(sourceFile);
      }
    }

    ts.transform([...sourceFiles], [findGlobalRewrites]);

    ts.transform(defaultLibraryFiles, [findRewritesInDefaultLibrary]);

    ts.transform(targetFiles, [findRewrites]);

    while (hadRenames) {
      // TODO make this linear instead of quadratic; build a graph to traverse
      hadRenames = false;
      ts.transform(targetFiles, [findImportRenames]);
    }
  }

  function findRewrites(context: ts.TransformationContext) {
    return visitSourceFile;

    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      return visitor(sourceFile);

      function visitor<T extends ts.Node>(node: T): T {
        if (isNamedDeclaration(node)) {
          visitNamedDeclaration(node);
        }

        return ts.visitEachChild(node, visitor, context);
      }

      function visitNamedDeclaration(node: { name: ts.DeclarationName }) {
        visitSymbol(checker.getSymbolAtLocation(node.name));
      }

      function visitSymbol(symbol: void | ts.Symbol) {
        if (!symbol) return;

        if (seenSymbols.has(symbol)) return;
        seenSymbols.add(symbol);

        if (
          symbol.flags & ts.SymbolFlags.TypeAlias &&
          symbol.flags & ts.SymbolFlags.Value
        ) {
          // TODO don't attempt if defined in non-target lib, like React
          // TODO pick non-colliding name
          const name = `${symbol.name}T`;
          symbolTypeRewrites.set(symbol, { kind: 'RenameType', name });
          hadRenames = true;
          return;
        }

        for (const decl of symbol.declarations ?? []) {
          if (ts.isImportSpecifier(decl)) {
            const module = getModuleSpecifier(decl.parent.parent.parent);
            const rewrites = libraryRewrites.get(module);
            if (!rewrites) return;
            const name = (decl.propertyName ?? decl.name).text;
            const typeRewrite = rewrites.types?.get(name);
            if (typeRewrite) symbolTypeRewrites.set(symbol, typeRewrite);
            const nsRewrite = rewrites.namespaces?.get(name);
            if (nsRewrite) symbolNamespaceRewrites.set(symbol, nsRewrite);
            return;
          } else if (ts.isImportClause(decl) || ts.isNamespaceImport(decl)) {
            // TODO: Do `import foo` and `import * as foo` need any different treatment?
            //   Here, we just treat them the same.
            const importClause = ts.isImportClause(decl) ? decl : decl.parent;
            const module = getModuleSpecifier(importClause.parent);
            const rewrites = libraryRewrites.get(module);
            if (rewrites) symbolNamespaceRewrites.set(symbol, rewrites);
            return;
          }
        }
      }
    }
  }

  /**
   * Search all files for `declare global`, and scan those for rewrites.
   *
   * In other words, scan all "global augmentation" declarations.
   */
  function findGlobalRewrites(context: ts.TransformationContext) {
    return visitSourceFile;

    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      // Declarations `declare global` are always directly nested in source
      // files.  In particular, if you try:
      //   namespace n { declare global { }}
      // you get the error:
      //   > Augmentations for the global scope can only be directly nested in
      //   > external modules or ambient module declarations.
      // So we just scan through the direct-child statements.
      for (const statement of sourceFile.statements) {
        // In the AST, they look like ts.ModuleDeclaration with flag
        // ts.NodeFlags.GlobalAugmentation.  (See reference in parser
        // to that flag.)
        if (
          ts.isModuleDeclaration(statement) &&
          statement.flags & ts.NodeFlags.GlobalAugmentation
        ) {
          visitGlobalAugmentation(statement, globalRewrites);
        }
      }
      return sourceFile;

      function visitGlobalAugmentation(
        node: ts.ModuleDeclaration,
        rewrites: NamespaceRewrite,
      ) {
        if (!node.body || !ts.isModuleBlock(node.body)) {
          // TODO(error): should be invalid TS
          return;
        }
        visitModuleBlock(node.body, rewrites);
      }

      function visitModuleBlock(
        node: ts.ModuleBlock,
        rewrites: NamespaceRewrite,
      ) {
        for (const statement of node.statements) {
          if (ts.isModuleDeclaration(statement)) {
            const subRewrites = rewrites.namespaces?.get(statement.name.text);
            if (!subRewrites) continue;
            if (!statement.body) continue; // TODO(error): invalid TS
            if (ts.isModuleBlock(statement.body)) {
              visitModuleBlock(statement.body, subRewrites);
            } else if (ts.isModuleDeclaration(statement.body)) {
              // TODO(unimplemented): `namespace n.m { … }`
            } else {
              // TODO(error): JSDoc annotation
            }
            continue;
          }

          if (ts.isInterfaceDeclaration(statement)) {
            const rewrite = rewrites.types?.get(statement.name.text);
            if (!rewrite) continue;
            const symbol = checker.getSymbolAtLocation(statement.name);
            if (!symbol) {
              // TODO(error): missing symbol
              continue;
            }
            symbolTypeRewrites.set(symbol, rewrite);
          }
          // TODO(unimplemented): other type declarations: type alias, class
          //   (for type parameters), enum, enum member; imports/re-exports?
        }
      }
    }
  }

  function findRewritesInDefaultLibrary(context: ts.TransformationContext) {
    return visitSourceFile;

    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      for (const statement of sourceFile.statements) {
        visitStatement(statement);
      }
      return sourceFile;

      function visitStatement(node: ts.Statement) {
        if (ts.isModuleDeclaration(node)) {
          // TODO add logic here to handle references to types in e.g. Intl;
          //   basically just recurse, but remembering what namespace we're in
          return;
        }

        if (
          ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node)
        ) {
          const { name } = node;
          const rewrite = defaultLibraryRewrites.types?.get(name.text);
          if (rewrite) {
            const symbol = checker.getSymbolAtLocation(name);
            if (!symbol) {
              warn(
                `missing symbol at declaration of ${name.text} in ${sourceFile.fileName}`,
              );
              return;
            }
            symbolTypeRewrites.set(symbol, rewrite);
          }
          return;
        }
      }
    }
  }

  function findImportRenames(context: ts.TransformationContext) {
    return visitSourceFile;

    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      sourceFile.statements.forEach(visitStatement);
      return sourceFile;

      function visitStatement(node: ts.Statement) {
        if (ts.isModuleDeclaration(node)) {
          visitModuleDeclaration(node);
        } else if (ts.isImportDeclaration(node)) {
          visitImportDeclaration(node);
        }
      }

      function visitModuleDeclaration(node: ts.ModuleDeclaration) {
        // I.e., a namespace declaration.  These can contain some kinds of
        // imports, so recurse.
        if (!node.body) return;
        switch (node.body.kind) {
          case ts.SyntaxKind.ModuleDeclaration:
            visitModuleDeclaration(node.body);
            break;
          case ts.SyntaxKind.ModuleBlock:
            node.body.statements.forEach(visitStatement);
            break;
          case ts.SyntaxKind.Identifier:
            // TODO(error): In fact it shouldn't even be possible to get
            //   here, because we don't recurse into JSDoc annotations.
            warn(
              `unsupported: JSDoc annotation for namespace ` +
                `${node.name} in ${sourceFile.fileName}`,
            );
            break;
          default:
            assertUnreachable(
              node.body,
              (b) => `ModuleBody kind: ${formatSyntaxKind(b.kind)}`,
            );
        }
      }

      function visitImportDeclaration(node: ts.ImportDeclaration) {
        if (!node.importClause) return;
        if (!node.importClause.namedBindings) return;
        if (!ts.isNamedImports(node.importClause.namedBindings)) return;
        node.importClause.namedBindings.elements.forEach(visitImportSpecifier);
      }

      function visitImportSpecifier(node: ts.ImportSpecifier) {
        const localSymbol = checker.getSymbolAtLocation(node.name);
        if (!localSymbol || symbolTypeRewrites.has(localSymbol)) {
          return;
        }

        const importedSymbol = checker.getImmediateAliasedSymbol(localSymbol);
        const mapped = importedSymbol && mapper.getSymbolAsType(importedSymbol);
        if (!mapped || mapped.kind !== 'RenameType') {
          return;
        }

        // TODO pick non-colliding name
        const name = `${localSymbol.name}T`;
        symbolTypeRewrites.set(localSymbol, { kind: 'RenameType', name });
        hadRenames = true;
      }
    }
  }

  function warn(description: string) {
    process.stderr.write(`warning: ${description}\n`);
  }
}
