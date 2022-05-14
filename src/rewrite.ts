import ts from "typescript";
import { builders as b, namedTypes as n } from "ast-types";
import K from "ast-types/gen/kinds";
import { Converter, ErrorOr, mkError, mkSuccess } from "./convert";
import {
  mapOfObject,
  mkFixedName,
  mkNamespaceRewrite,
  mkTypeReferenceMacro,
  NamespaceRewrite,
} from "./rewrite/core";
import { prepGlobalJsxRewrites, prepReactRewrites } from "./rewrite/react";

export type { NamespaceRewrite, TypeRewrite } from "./rewrite/core";

export const defaultLibraryRewrites: NamespaceRewrite = mkNamespaceRewrite({
  Readonly: mkFixedName("$ReadOnly"),
  ReadonlyArray: mkFixedName("$ReadOnlyArray"),
  Omit: mkTypeReferenceMacro(convertOmit),
  // If adding to this: note that any `namespaces` map is ignored.
  // See findRewritesInDefaultLibrary.
});

export const globalRewrites: NamespaceRewrite = mkNamespaceRewrite(undefined, {
  // If adding to this: note the unimplemented cases in findGlobalRewrites,
  // where we use this map.
  JSX: prepGlobalJsxRewrites(),
});

export const libraryRewrites: Map<string, NamespaceRewrite> = mapOfObject({
  // If adding to this: note that currently any namespace rewrites within a
  // given library are ignored!  That is, the `namespaces` property of one
  // of these NamespaceRewrite values is never consulted.  See use sites.

  // All from `@types/react/index.d.ts`.
  react: prepReactRewrites(),
});

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
