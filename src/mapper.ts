import ts from "typescript";
import { builders as b, namedTypes as _n } from "ast-types";
import K from "ast-types/gen/kinds";
import { some } from "./util";

export enum MapResultType {
  FixedName,
  TypeReferenceMacro,
}

export type MapResult =
  | { type: MapResultType.FixedName; name: string }
  | {
      type: MapResultType.TypeReferenceMacro;
      convert(
        typeArguments: ts.NodeArray<ts.TypeNode> | undefined
      ): K.FlowTypeKind;
    };

export interface Mapper {
  getSymbol(symbol: ts.Symbol): void | MapResult;
}

const defaultLibraryRewrites: Map<string, MapResult> = new Map([
  ["ReadonlyArray", { type: MapResultType.FixedName, name: "$ReadOnlyArray" }],
  ["Omit", { type: MapResultType.TypeReferenceMacro, convert: convertOmit }],
]);

function convertOmit(
  typeArguments: ts.NodeArray<ts.TypeNode> | undefined
): K.FlowTypeKind {
  // TODO: This really needs to be able to call converter methods,
  //   as several TODOs below attest.

  if (typeArguments?.length !== 2) throw new Error("bad Omit"); // TODO(error)
  const [objectType, omitKeysType] = typeArguments;

  let subtrahend;
  switch (omitKeysType.kind) {
    case ts.SyntaxKind.LiteralType: {
      const { literal } = omitKeysType as ts.LiteralTypeNode;
      if (!ts.isStringLiteral(literal))
        throw new Error("bad Omit: literal but non-string"); // TODO(error)
      subtrahend = b.objectTypeAnnotation.from({
        exact: true,
        properties: [
          b.objectTypeProperty(
            b.identifier(literal.text),
            b.mixedTypeAnnotation(),
            false
          ),
        ],
      });
      break;
    }

    case ts.SyntaxKind.UnionType:
    default:
      throw new Error("bad Omit: unimplemented second type"); // TODO(error)
  }

  return b.genericTypeAnnotation(
    b.identifier("$Diff"),
    b.typeParameterInstantiation([
      // TODO: convertType(objectType)
      b.genericTypeAnnotation(b.identifier("$FlowFixMe"), null), // TODO(error)
      subtrahend,
    ])
  );
}

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
