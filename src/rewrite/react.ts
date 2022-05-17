import ts from 'typescript';
import { builders as b, namedTypes as n } from 'ast-types';
import K from 'ast-types/gen/kinds';
// @ts-expect-error no TS types for flow-parser :-p
import * as flowParser from 'flow-parser';
import * as recast from 'recast';
import { Converter, ErrorOr, mkError, mkSuccess } from '../convert';
import {
  mkFixedName,
  mkNamespaceRewrite,
  mkSubstituteType,
  mkTypeReferenceMacro,
  NamespaceRewrite,
} from './core';

const prefix = '$tsflower_subst$React$';

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
    args = [b.genericTypeAnnotation(b.identifier('React$ElementType'), null)];
  } else if (!typeType) {
    args = [
      b.genericTypeAnnotation(
        b.identifier('React$ComponentType'),
        b.typeParameterInstantiation([converter.convertType(propsType)]),
      ),
    ];
  } else {
    args = [converter.convertType(typeType)];
  }

  return mkSuccess({
    id: b.identifier('React$Element'), // TODO use import
    typeParameters: b.typeParameterInstantiation(args),
  });
}

// See comment on substituteReactRef.
const substituteReactRefObject = mkSubstituteType(`${prefix}RefObject`, () => {
  const text = `
  type ${prefix}RefObject<T> = { +current: T | null, ... };
`;
  return recast.parse(text, { parser: flowParser }).program.body;
});

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
const substituteReactRef = mkSubstituteType(
  `${prefix}Ref`,
  () => {
    const text = `
  // NB mixed return, not void; see e.g. flowlib's React$Ref
  type ${prefix}RefCallback<T> = (T | null) => mixed;
  type ${prefix}Ref<T> = ${prefix}RefCallback<T> | ${prefix}RefObject<T> | null;
`.replace(/^\s*\/\/.*\n?/gm, '');
    return recast.parse(text, { parser: flowParser }).program.body;
  },
  [substituteReactRefObject],
);

const substituteReactRefAttributes = mkSubstituteType(
  `${prefix}RefAttributes`,
  () => {
    // Definition in @types/react/index.d.ts:
    //   type Key = string | number;
    //   interface Attributes {
    //     key?: Key | null | undefined;
    //   }
    //   interface RefAttributes<T> extends Attributes {
    //     ref?: Ref<T> | undefined;
    //   }
    const text = `
    type ${prefix}RefAttributes<T> = {
      key?: string | number | void | null,
      ref?: void | ${substituteReactRef.name}<T>,
      ...
    }`.replace(/^\s*\/\/.*\n?/gm, '');
    return recast.parse(text, { parser: flowParser }).program.body;
  },
  [substituteReactRef],
);

// // @types/react/index.d.ts
// declare global {
//   namespace JSX {
//       interface Element extends React.ReactElement<any, any> { }
//
// So do the equivalent of convertReactElement with `any, any`.
function convertJsxElement() {
  return mkSuccess({
    id: b.identifier('React$Element'), // TODO use import
    typeParameters: b.typeParameterInstantiation([b.anyTypeAnnotation()]),
  });
}

/**
 * Prepare our static rewrite plans for the 'react' module.
 */
export function prepReactRewrites(): NamespaceRewrite {
  // All from `@types/react/index.d.ts`.

  return mkNamespaceRewrite({
    Component: mkTypeReferenceMacro(convertReactComponent),
    ReactElement: mkTypeReferenceMacro(convertReactElement),
    ComponentProps: mkFixedName('React$ElementConfig'), // TODO use import

    // type ReactNode = ReactElement | string | number | …
    ReactNode: mkFixedName('React$Node'), // TODO use import

    RefObject: substituteReactRefObject,
    Ref: substituteReactRef,
    RefAttributes: substituteReactRefAttributes,

    // The `@types/react` definition of ForwardRefExoticComponent has
    // various hair on it, but ultimately its job is to model the return
    // type of React.forwardRef.  In flowlib, that returns a certain
    // React$AbstractComponent.  The second ("Instance") type parameter
    // seems hard to recover, so just approximate it as `mixed`… and that's
    // what React$ComponentType does.
    ForwardRefExoticComponent: mkFixedName('React$ComponentType'), // TODO use import

    // Similarly MemoExoticComponent models the return type of React.memo.
    // Here the type argument is actually the component type (the type of
    // the function's first argument), not the props.  In flowlib, the
    // argument and return types are the same; so it's the identity.
    MemoExoticComponent: mkSubstituteType(`${prefix}Nop`, () => {
      const text = `type ${prefix}Nop<+T> = T;`;
      return recast.parse(text, { parser: flowParser }).program.body;
    }),

    // And NamedExoticComponent is the base interface of ForwardRefExoticComponent.
    NamedExoticComponent: mkFixedName('React$ComponentType'), // TODO use import

    // If adding to this: note that currently any namespace rewrites within a
    // given library are ignored!  That is, the `namespaces` property of one
    // of these NamespaceRewrite values is never consulted.  See use sites.
  });
}

/**
 * Prepare our static rewrites for the global `JSX` namespace from `@types/react`.
 */
export function prepGlobalJsxRewrites(): NamespaceRewrite {
  return mkNamespaceRewrite({
    Element: mkTypeReferenceMacro(convertJsxElement),
    // If adding to this: note the unimplemented cases in findGlobalRewrites,
    // where we use this map.
  });
}
