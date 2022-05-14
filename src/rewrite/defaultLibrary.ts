import ts from "typescript";
import { builders as b, namedTypes as n } from "ast-types";
import K from "ast-types/gen/kinds";
import {
  Converter,
  ErrorOr,
  mkError,
  mkSuccess,
  mkUnimplemented,
} from "../convert";
import { mkFixedName, mkNamespaceRewrite, mkTypeReferenceMacro } from "./core";

function convertRecord(
  _converter: Converter,
  _typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<{
  id: K.IdentifierKind | n.QualifiedTypeIdentifier;
  typeParameters: n.TypeParameterInstantiation | null;
}> {
  if (typeArguments?.length !== 2) {
    return mkError(
      `bad Record: ${typeArguments?.length ?? 0} arguments (expected 2)`,
    );
  }
  // const [keysType, valueType] = typeArguments;

  // TODO: Add facility for macro returning a *type*, not pieces of a
  //   TypeReference-like.  Then can implement this like so:
  //
  // if (keysType.kind === ts.SyntaxKind.StringKeyword) {
  //   return mkSuccess(
  //     b.objectTypeAnnotation(
  //       [],
  //       [
  //         b.objectTypeIndexer(
  //           b.identifier("key"), // TODO(ast-types): this should be omitted
  //           b.stringTypeAnnotation(),
  //           converter.convertType(valueType),
  //         ),
  //       ],
  //     ),
  //   );
  // }
  // // … and so on.

  return mkUnimplemented(`Record`);
}

function convertOmit(
  converter: Converter,
  // @ts-expect-error yes, this is unused
  typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<{
  id: K.IdentifierKind | n.QualifiedTypeIdentifier;
  typeParameters: n.TypeParameterInstantiation | null;
}> {
  if (typeArguments?.length !== 2) {
    return mkError(
      `bad Omit: ${typeArguments?.length ?? 0} arguments (expected 2)`,
    );
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
          false,
        ),
      ],
    });
  } else if (
    ts.isUnionTypeNode(keysType) &&
    keysType.types.every(
      (t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal),
    )
  ) {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: keysType.types.map((t) =>
        b.objectTypeProperty(
          b.stringLiteral(
            ((t as ts.LiteralTypeNode).literal as ts.StringLiteral).text,
          ),
          b.mixedTypeAnnotation(),
          false,
        ),
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
          b.mixedTypeAnnotation(),
        ),
      ],
    });
  }

  return mkSuccess({
    id: b.identifier("$Diff"),
    typeParameters: b.typeParameterInstantiation([
      converter.convertType(objectType),
      subtrahend,
    ]),
  });
}

/**
 * Our static rewrite plans for the TS "default library", i.e. stdlib.
 */
export function prepDefaultLibraryRewrites() {
  return mkNamespaceRewrite({
    Readonly: mkFixedName("$ReadOnly"),
    ReadonlyArray: mkFixedName("$ReadOnlyArray"),
    Record: mkTypeReferenceMacro(convertRecord),
    Omit: mkTypeReferenceMacro(convertOmit),
    // If adding to this: note that any `namespaces` map is ignored.
    // See findRewritesInDefaultLibrary.
  });
}
