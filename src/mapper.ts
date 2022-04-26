import ts from "typescript";
import { builders as b, namedTypes as _n } from "ast-types";
import K from "ast-types/gen/kinds";
import { some } from "./util";
import { Converter } from "./convert";

export enum MapResultType {
  FixedName,
  TypeReferenceMacro,
}

export type MapResult =
  | { type: MapResultType.FixedName; name: string }
  | {
      type: MapResultType.TypeReferenceMacro;
      convert(converter: Converter, node: ts.TypeReferenceNode): K.FlowTypeKind;
    };

export interface Mapper {
  getSymbol(symbol: ts.Symbol): void | MapResult;
}

const defaultLibraryRewrites: Map<string, MapResult> = new Map([
  ["ReadonlyArray", { type: MapResultType.FixedName, name: "$ReadOnlyArray" }],
  ["Omit", { type: MapResultType.TypeReferenceMacro, convert: convertOmit }],
]);

function convertOmit(
  converter: Converter,
  node: ts.TypeReferenceNode
): K.FlowTypeKind {
  const { typeArguments } = node;
  if (typeArguments?.length !== 2) {
    return error(`${typeArguments?.length ?? 0} arguments (expected 2)`);
  }
  const [objectType, keysType] = typeArguments;

  let subtrahend;
  if (ts.isLiteralTypeNode(keysType) && ts.isStringLiteral(keysType.literal)) {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: [
        b.objectTypeProperty(
          b.stringLiteral(keysType.literal.text),
          b.mixedTypeAnnotation(),
          false
        ),
      ],
    });
  } else if (
    ts.isUnionTypeNode(keysType) &&
    keysType.types.every(
      (t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)
    )
  ) {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: keysType.types.map((t) =>
        b.objectTypeProperty(
          b.stringLiteral(
            ((t as ts.LiteralTypeNode).literal as ts.StringLiteral).text
          ),
          b.mixedTypeAnnotation(),
          false
        )
      ),
    });
  } else {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: [],
      indexers: [
        b.objectTypeIndexer(
          b.identifier("key"),
          converter.convertType(keysType),
          b.mixedTypeAnnotation()
        ),
      ],
    });
  }

  return b.genericTypeAnnotation(
    b.identifier("$Diff"),
    b.typeParameterInstantiation([
      converter.convertType(objectType),
      subtrahend,
    ])
  );

  function error(description: string) {
    return converter.errorType(node, `bad Omit: ${description}`);
  }
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
