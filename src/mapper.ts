import path from "path";
import ts from "typescript";
import { builders as _b, namedTypes as n } from "ast-types";
import K from "ast-types/gen/kinds";
import { some } from "./util";
import { Converter, ErrorOr } from "./convert";
import {
  getModuleSpecifier,
  isEntityNameOrEntityNameExpression,
  isNamedDeclaration,
} from "./tsutil";
import { defaultLibraryRewrites, libraryRewrites } from "./rewrite";
import {
  formatNodeFlags,
  formatSymbol,
  formatSymbolFlags,
  formatSyntaxKind,
} from "./tsdebug";

/*
 * See docs/notes/mapper.md for some scratch notes on the background
 * and architecture of this.
 */

export type MapResultType = "FixedName" | "TypeReferenceMacro";

export type MapResult =
  | { type: "FixedName"; name: string }
  /**
   * Rename this type, both at its definition and references.
   *
   * Used in particular where TS has a type and value sharing a name, which
   * Flow doesn't permit.  The value keeps the name, and the type gets a new
   * one.
   *
   * There's an asymmetry here: we don't have a "RenameValue".  That's
   * because we're translating type definitions, but those type definitions
   * describe some actual runtime JS, which we don't modify (or even see),
   * and the value name is a real fact about that actual runtime JS.
   */
  | { type: "RenameType"; name: string }
  | {
      type: "TypeReferenceMacro";
      convert(
        converter: Converter,
        typeName: ts.EntityNameOrEntityNameExpression,
        typeArguments: ts.NodeArray<ts.TypeNode> | void,
      ): ErrorOr<{
        id: K.IdentifierKind | n.QualifiedTypeIdentifier;
        typeParameters: n.TypeParameterInstantiation | null;
      }>;
    };

export interface Mapper {
  /** (Each call to this in the converter should have a corresponding case
   * in the visitor in `createMapper`, to ensure that we find and
   * investigate that symbol.) */
  getSymbol(symbol: ts.Symbol): void | MapResult;

  getQualifiedSymbol(
    qualifierSymbol: ts.Symbol,
    name: string,
  ): void | MapResult;

  getTypeName(typeName: ts.EntityNameOrEntityNameExpression): void | MapResult;
}

export function createMapper(program: ts.Program, targetFilenames: string[]) {
  const targetSet = new Set(targetFilenames.map((f) => path.resolve(f)));
  const checker = program.getTypeChecker();
  const seenSymbols: Set<ts.Symbol> = new Set();
  let hadRenames = false;

  const mappedSymbols: Map<ts.Symbol, MapResult> = new Map();
  const mappedModuleSymbols: Map<ts.Symbol, Map<string, MapResult>> = new Map();

  const mapper: Mapper = {
    getSymbol: (symbol) => mappedSymbols.get(symbol),
    getQualifiedSymbol: (qualifierSymbol, name) =>
      mappedModuleSymbols.get(qualifierSymbol)?.get(name),
    getTypeName: (node) => {
      const symbol = checker.getSymbolAtLocation(node);
      const mapped = symbol && mapper.getSymbol(symbol);
      if (mapped) return mapped;

      if (ts.isIdentifier(node)) return undefined;
      const qualifier = ts.isQualifiedName(node) ? node.left : node.expression;
      const name = ts.isQualifiedName(node) ? node.right.text : node.name.text;
      const qualifierSymbol = checker.getSymbolAtLocation(qualifier);
      return (
        qualifierSymbol && mapper.getQualifiedSymbol(qualifierSymbol, name)
      );
    },
  };

  initMapper();

  seenSymbols.clear();
  targetSet.clear();

  return mapper;

  function initMapper() {
    const sourceFiles = program.getSourceFiles();
    const targetFiles = sourceFiles.filter((sourceFile) =>
      targetSet.has(path.resolve(sourceFile.fileName)),
    );

    targetFiles.forEach(findRewrites);

    while (hadRenames) {
      // TODO make this linear instead of quadratic; build a graph to traverse
      hadRenames = false;
      targetFiles.forEach(findImportRenames);
    }
  }

  function findRewrites(sourceFile: ts.SourceFile) {
    ts.transform(sourceFile, [visitorFactory]);
    return;

    function visitorFactory(context: ts.TransformationContext) {
      return visitor;

      function visitor(node: ts.Node): ts.Node {
        if (isNamedDeclaration(node)) {
          visitNamedDeclaration(node);
        }

        switch (node.kind) {
          case ts.SyntaxKind.TypeReference:
            visitTypeReference(node as ts.TypeReferenceNode);
            break;
          case ts.SyntaxKind.HeritageClause:
            visitHeritageClause(node as ts.HeritageClause);
            break;
        }

        return ts.visitEachChild(node, visitor, context);
      }

      function visitNamedDeclaration(node: { name: ts.DeclarationName }) {
        visitSymbol(checker.getSymbolAtLocation(node.name));
      }

      function visitTypeReference(node: ts.TypeReferenceNode) {
        visitTypeName(node.typeName);
      }

      function visitHeritageClause(node: ts.HeritageClause) {
        for (const base of node.types) {
          const { expression } = base;
          if (!isEntityNameOrEntityNameExpression(expression)) continue;
          visitTypeName(expression);
        }
      }

      function visitTypeName(name: ts.EntityNameOrEntityNameExpression) {
        visitSymbol(checker.getSymbolAtLocation(name));
        if (ts.isQualifiedName(name)) {
          visitSymbol(checker.getSymbolAtLocation(name.right));
          visitTypeName(name.left);
        } else if (ts.isPropertyAccessExpression(name)) {
          visitSymbol(checker.getSymbolAtLocation(name.name));
          visitTypeName(name.expression);
        }
      }

      function visitSymbol(symbol: void | ts.Symbol) {
        if (!symbol) return;

        if (seenSymbols.has(symbol)) return;
        seenSymbols.add(symbol);

        if (symbol.name === "Element") {
          console.log(
            // symbol,
            formatSymbol(symbol),
            symbol.declarations?.map((d) => formatSyntaxKind(d.kind)),
            formatSymbol(symbol.parent),
            // symbol.parent.parent,
            // symbol.declarations[0].parent,
            formatSyntaxKind(symbol.declarations[0].kind),
            formatSyntaxKind(symbol.declarations[0].parent.kind),
            formatSyntaxKind(symbol.declarations[0].parent.parent.kind),
            formatSyntaxKind(symbol.declarations[0].parent.parent.parent?.kind),
            formatSyntaxKind(
              symbol.declarations[0].parent.parent.parent?.parent?.kind,
            ),
            formatSyntaxKind(
              symbol.declarations[0].parent.parent.parent?.parent?.parent?.kind,
            ),
          );
          let n: ts.Node = symbol.declarations[0];
          while (n) {
            console.log(
              formatSyntaxKind(n.kind),
              formatNodeFlags(n.flags),
              n.name?.escapedText,
              formatSymbol(n.symbol),
              formatSymbol(n.localSymbol),
            );
            n = n.parent;
          }
        }

        if (some(symbol.declarations, isDefaultLibraryTopLevelDeclaration)) {
          const rewrite = defaultLibraryRewrites.get(symbol.name);
          if (rewrite) mappedSymbols.set(symbol, rewrite);
          return;
        }

        if (
          symbol.flags & ts.SymbolFlags.TypeAlias &&
          symbol.flags & ts.SymbolFlags.Value
        ) {
          // TODO don't attempt if defined in non-target lib, like React
          // TODO pick non-colliding name
          const name = `${symbol.name}T`;
          mappedSymbols.set(symbol, { type: "RenameType", name });
          hadRenames = true;
          return;
        }

        for (const decl of symbol.declarations ?? []) {
          if (ts.isImportSpecifier(decl)) {
            const module = getModuleSpecifier(decl.parent.parent.parent);
            const name = (decl.propertyName ?? decl.name).text;
            const rewrite = libraryRewrites.get(module)?.get(name);
            if (rewrite) mappedSymbols.set(symbol, rewrite);
            return;
          } else if (ts.isImportClause(decl) || ts.isNamespaceImport(decl)) {
            // TODO: Do `import foo` and `import * as foo` need any different treatment?
            //   Here, we just treat them the same.
            const importClause = ts.isImportClause(decl) ? decl : decl.parent;
            const module = getModuleSpecifier(importClause.parent);
            const rewrites = libraryRewrites.get(module);
            if (rewrites) mappedModuleSymbols.set(symbol, rewrites);
            return;
          }
        }
      }

      function isDefaultLibraryTopLevelDeclaration(
        node: ts.Declaration,
      ): boolean {
        const { parent } = node;
        return (
          parent &&
          ts.isSourceFile(parent) &&
          program.isSourceFileDefaultLibrary(parent)
        );
      }
    }
  }

  function findImportRenames(sourceFile: ts.SourceFile) {
    ts.transform(sourceFile, [visitorFactory]);
    return;

    function visitorFactory(context: ts.TransformationContext) {
      return visitor;

      function visitor(node: ts.Node): ts.Node {
        switch (node.kind) {
          case ts.SyntaxKind.ImportSpecifier:
            visitImportSpecifier(node as ts.ImportSpecifier);
          // TODO also `export … from`?
        }

        return ts.visitEachChild(node, visitor, context);
      }

      function visitImportSpecifier(node: ts.ImportSpecifier) {
        const localSymbol = checker.getSymbolAtLocation(node.name);
        if (!localSymbol || mappedSymbols.has(localSymbol)) {
          return;
        }

        const importedSymbol = checker.getImmediateAliasedSymbol(localSymbol);
        const mapped = importedSymbol && mapper.getSymbol(importedSymbol);
        if (!mapped || mapped.type !== "RenameType") {
          return;
        }

        // TODO pick non-colliding name
        const name = `${localSymbol.name}T`;
        mappedSymbols.set(localSymbol, { type: "RenameType", name });
        hadRenames = true;
      }
    }
  }
}
