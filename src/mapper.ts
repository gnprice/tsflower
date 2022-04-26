import ts from "typescript";
import { some } from "./util";

export enum MapResultType {
  FixedName,
}

export type MapResult = { type: MapResultType.FixedName; name: string };

export interface Mapper {
  getSymbol(symbol: ts.Symbol): void | MapResult;
}

const defaultLibraryRewrites: Map<string, MapResult> = new Map([
  ["ReadonlyArray", { type: MapResultType.FixedName, name: "$ReadOnlyArray" }],
]);

export function createMapper(program: ts.Program, targetFilenames: string[]) {
  const targetSet = new Set(targetFilenames);
  const checker = program.getTypeChecker();
  const seenSymbols: Set<ts.Symbol> = new Set();

  const mappedSymbols: Map<ts.Symbol, MapResult> = new Map();

  const mapper: Mapper = {
    getSymbol: (symbol) => mappedSymbols.get(symbol),
  };

  initMapper();

  // console.log(mappedSymbols.size);

  seenSymbols.clear();
  targetSet.clear();

  return mapper;

  function initMapper() {
    const sourceFiles = program.getSourceFiles();
    for (let i = 0; i < sourceFiles.length; i++) {
      const sourceFile = sourceFiles[i];

      if (program.isSourceFileDefaultLibrary(sourceFile)) {
        // const { exports } = sourceFile.;
        // console.log(sourceFile.fileName);
      }

      if (targetSet.has(sourceFile.fileName)) {
        findRewrites(sourceFile);
      }
    }
  }

  function findRewrites(sourceFile: ts.SourceFile) {
    ts.transform(sourceFile, [visitorFactory]);
    return;

    function visitorFactory(context: ts.TransformationContext) {
      return visitor;

      function visitor(node: ts.Node): ts.Node {
        switch (node.kind) {
          case ts.SyntaxKind.TypeReference: {
            visitTypeReference(node as ts.TypeReferenceNode);
          }
        }

        return ts.visitEachChild(node, visitor, context);
      }

      function visitTypeReference(node: ts.TypeReferenceNode) {
        let name = node.typeName;
        visitSymbol(checker.getSymbolAtLocation(name));
        while (ts.isQualifiedName(name)) {
          visitSymbol(checker.getSymbolAtLocation(name.right));
          name = name.left;
          visitSymbol(checker.getSymbolAtLocation(name));
        }
      }

      function visitSymbol(symbol: void | ts.Symbol) {
        if (!symbol) return;

        if (seenSymbols.has(symbol)) return;
        seenSymbols.add(symbol);

        if (some(symbol.declarations, isDefaultLibraryTopLevelDeclaration)) {
          // console.log(symbol.name);

          const rewrite = defaultLibraryRewrites.get(symbol.name);
          if (rewrite) mappedSymbols.set(symbol, rewrite);
        }
      }

      function isDefaultLibraryTopLevelDeclaration(
        node: ts.Declaration
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
}
