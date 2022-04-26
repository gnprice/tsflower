import ts from "typescript";
import { some } from "./util";

export type MapResult = true;

export interface Mapper {
  getSymbol(symbol: ts.Symbol): void | MapResult;
}

export function createMapper(program: ts.Program, targetFilenames: string[]) {
  const targetSet = new Set(targetFilenames);

  const checker = program.getTypeChecker();

  const symbols: Map<ts.Symbol, MapResult> = new Map();

  const mapper: Mapper = {
    getSymbol: (symbol) => symbols.get(symbol),
  };

  initMapper();

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
        const symbol = checker.getSymbolAtLocation(node.typeName);
        if (!symbol) return;

        if (some(symbol.declarations, isDefaultLibraryTopLevelDeclaration)) {
          // console.log(symbol.name);
          symbols.set(symbol, true);
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
