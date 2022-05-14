import ts from "typescript";
import { builders as b, namedTypes as n } from "ast-types";
import K from "ast-types/gen/kinds";
// @ts-expect-error no TS types for flow-parser :-p
import * as flowParser from "flow-parser";
import * as recast from "recast";
import { Converter, ErrorOr, mkError, mkSuccess } from "./convert";
import {
  mapOfObject,
  mkFixedName,
  mkNamespaceRewrite,
  mkSubstituteType,
  mkTypeReferenceMacro,
  NamespaceRewrite,
} from "./rewrite/core";

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
  JSX: mkNamespaceRewrite({
    Element: mkTypeReferenceMacro(convertJsxElement),
  }),
});

export const libraryRewrites: Map<string, NamespaceRewrite> = mapOfObject({
  // If adding to this: note that currently any namespace rewrites within a
  // given library are ignored!  That is, the `namespaces` property of one
  // of these NamespaceRewrite values is never consulted.  See use sites.

  // All from `@types/react/index.d.ts`.
  react: mkNamespaceRewrite({
    Component: mkTypeReferenceMacro(convertReactComponent),
    ReactElement: mkTypeReferenceMacro(convertReactElement),
    // type ReactNode = ReactElement | string | number | …
    ReactNode: mkFixedName("React$Node"), // TODO use import
    // TODO define substitute's name next to substitute code
    Ref: mkSubstituteType("$tsflower_subst$React$Ref", substituteReactRef),
    RefAttributes: mkSubstituteType(
      "$tsflower_subst$React$RefAttributes",
      substituteReactRefAttributes,
    ),
  }),
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

function convertReactComponent(
  converter: Converter,
  typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<{
  id: K.IdentifierKind | n.QualifiedTypeIdentifier;
  typeParameters: n.TypeParameterInstantiation | null;
}> {
  if ((typeArguments?.length ?? 0) > 2) {
    return mkError(
      `bad React.Component: ${
        typeArguments?.length ?? 0
      } arguments (expected 0-2)`,
    );
  }
  const [propsType, stateType] = typeArguments ?? [];

  const args = [
    propsType
      ? converter.convertType(propsType)
      : b.objectTypeAnnotation.from({ properties: [], inexact: true }),
    ...(stateType ? [converter.convertType(stateType)] : []),
  ];

  return mkSuccess({
    id: converter.convertEntityNameAsType(typeName),
    typeParameters: b.typeParameterInstantiation(args),
  });
}

function convertReactElement(
  converter: Converter,
  // @ts-expect-error yes, this is unused
  typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
) {
  // TODO: If ReactElement is imported individually, we also need to rewrite
  //   that import.

  if ((typeArguments?.length ?? 0) > 2) {
    return mkError(
      `bad React.Element: ${
        typeArguments?.length ?? 0
      } arguments (expected 0-2)`,
    );
  }
  const [propsType, typeType] = typeArguments ?? [];

  let args;
  if (!propsType) {
    args = [b.genericTypeAnnotation(b.identifier("React$ElementType"), null)];
  } else if (!typeType) {
    args = [
      b.genericTypeAnnotation(
        b.identifier("React$ComponentType"),
        b.typeParameterInstantiation([converter.convertType(propsType)]),
      ),
    ];
  } else {
    args = [converter.convertType(typeType)];
  }

  return mkSuccess({
    id: b.identifier("React$Element"), // TODO use import
    typeParameters: b.typeParameterInstantiation(args),
  });
}

// Definition in @types/react/index.d.ts:
//   interface RefObject<T> {
//     readonly current: T | null;
//   }
//   // Bivariance hack for consistent unsoundness with RefObject
//   type RefCallback<T> = { bivarianceHack(instance: T | null): void }["bivarianceHack"];
//   type Ref<T> = RefCallback<T> | RefObject<T> | null;
//
// There's no definition in flowlib's react.js that corresponds; the types
// of `useImperativeHandle` and `forwardRef` spell it out.  There's
// `React.Ref`, but it's the type of the `ref` pseudoprop; its type
// parameter is the ElementType of the element, and it passes that to
// `React$ElementRef` to work out what type the ref should hold.
//
// So, just emit a definition of our own.
function substituteReactRef() {
  const prefix = "$tsflower_subst$React$";
  const text = `
  type ${prefix}RefObject<T> = { +current: T | null, ... };
  // NB mixed return, not void; see e.g. flowlib's React$Ref
  type ${prefix}RefCallback<T> = (T | null) => mixed;
  type ${prefix}Ref<T> = ${prefix}RefCallback<T> | ${prefix}RefObject<T> | null;
`.replace(/^\s*\/\/.*\n?/gm, "");
  return recast.parse(text, { parser: flowParser }).program.body;
}

function substituteReactRefAttributes() {
  const prefix = "$tsflower_subst$React$";
  // Definition in @types/react/index.d.ts:
  //   type Key = string | number;
  //   interface Attributes {
  //     key?: Key | null | undefined;
  //   }
  //   interface RefAttributes<T> extends Attributes {
  //     ref?: Ref<T> | undefined;
  //   }

  // TODO: express a dependency on React.Ref substitution,
  //   so we can use this
  // const text = `
  // type ${prefix}RefAttributes<T> = {
  //   key?: string | number | void | null,
  //   ref?: void | ${prefix}Ref<T>,
  //   ...
  // }`.replace(/^\s*\/\/.*\n?/gm, "");

  const text = `\
  type ${prefix}RefAttributes<T> = $FlowFixMe /* tsflower-unimplemented: React.RefAttributes */;
  `;
  return recast.parse(text, { parser: flowParser }).program.body;
}

// // @types/react/index.d.ts
// declare global {
//   namespace JSX {
//       interface Element extends React.ReactElement<any, any> { }
//
// So do the equivalent of convertReactElement with `any, any`.
function convertJsxElement() {
  return mkSuccess({
    id: b.identifier("React$Element"), // TODO use import
    typeParameters: b.typeParameterInstantiation([b.anyTypeAnnotation()]),
  });
}
