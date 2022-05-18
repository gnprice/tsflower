import ts from 'typescript';
import { builders as b, namedTypes as n } from 'ast-types';
import K from 'ast-types/gen/kinds';
import { Converter, ErrorOr, mkError, mkSuccess } from '../convert';
import {
  mkFixedName,
  mkNamespaceRewrite,
  mkTypeReferenceMacro,
  NamespaceRewrite,
  prepSubstituteType,
} from './core';

const prefix = '$tsflower_subst$React$';

function prepImportSubstitute(tsName: string) {
  return prepSubstituteType(
    `${prefix}${tsName}`,
    (name) =>
      `import { type ${tsName} as ${name} } from "tsflower/subst/react";`,
  );
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

// @types/react:
//   interface FunctionComponent<P = {}> {
// flowlib:
//   declare type React$StatelessFunctionalComponent<Props> = {
// So we need to fill in that default for the type argument.
function convertFunctionComponent(
  converter: Converter,
  typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<{
  id: K.IdentifierKind | n.QualifiedTypeIdentifier;
  typeParameters: n.TypeParameterInstantiation | null;
}> {
  if ((typeArguments?.length ?? 0) > 1) {
    return mkError(
      `bad React.FunctionComponent: ${
        typeArguments?.length ?? 0
      } arguments (expected 0-1)`,
    );
  }
  const [propsType] = typeArguments ?? [];

  const args = [
    propsType
      ? converter.convertType(propsType)
      : b.objectTypeAnnotation.from({ properties: [], inexact: true }),
  ];

  return mkSuccess({
    id: b.identifier('React$StatelessFunctionalComponent'), // TODO use import
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

// In @types/react:
//   type PropsWithChildren<P> = P & { children?: ReactNode | undefined };
const substitutePropsWithChildren = prepSubstituteType(
  `${prefix}PropsWithChildren`,
  (name) => `type ${name}<+P> = { ...P, children?: React$Node | void, ... };`,
);

// In @types/react:
//   /** Ensures that the props do not include ref at all */
//   type PropsWithoutRef<P> = …
// The definition is complicated for reasons that seem TS-specific.
// Make it easy with Flow's `$Rest`.
const substitutePropsWithoutRef = prepSubstituteType(
  `${prefix}PropsWithoutRef`,
  (name) => `type ${name}<P> = $Rest<P, {| ref: mixed |}>;`,
);

// In @types/react:
//   interface MutableRefObject<T> { current: T; }
const substituteMutableRefObject = prepSubstituteType(
  `${prefix}MutableRefObject`,
  (name) => `type ${name}<T> = { current: T, ... };`,
);

// See comment on substituteReactRef.
const substituteReactRefObject = prepSubstituteType(
  `${prefix}RefObject`,
  (name) => `type ${name}<T> = { +current: T | null, ... };`,
);

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
const substituteReactRef = prepSubstituteType(
  `${prefix}Ref`,
  // TODO(substitute) Give the auxiliary definition its own substitution
  (name) => `
    // NB mixed return, not void; see e.g. flowlib's React$Ref
    type ${prefix}RefCallback<T> = (T | null) => mixed;
    type ${name}<T> = ${prefix}RefCallback<T> | ${substituteReactRefObject.name}<T> | null;
  `,
  [substituteReactRefObject],
);

const substituteReactRefAttributes = prepSubstituteType(
  `${prefix}RefAttributes`,
  // Definition in @types/react/index.d.ts:
  //   type Key = string | number;
  //   interface Attributes {
  //     key?: Key | null | undefined;
  //   }
  //   interface RefAttributes<T> extends Attributes {
  //     ref?: Ref<T> | undefined;
  //   }
  (name) => `
    type ${name}<T> = {
      key?: string | number | void | null,
      ref?: void | ${substituteReactRef.name}<T>,
      ...
    }`,
  [substituteReactRef],
);

function prepSubstituteContext() {
  return {
    ProviderProps: prepImportSubstitute('ProviderProps'),
    ConsumerProps: prepImportSubstitute('ConsumerProps'),
    Provider: prepImportSubstitute('Provider'),
    Consumer: prepImportSubstitute('Consumer'),
    Context: mkFixedName('React$Context'),
  };
}

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
    FunctionComponent: mkTypeReferenceMacro(convertFunctionComponent),
    ReactElement: mkTypeReferenceMacro(convertReactElement),
    ComponentProps: mkFixedName('React$ElementConfig'), // TODO use import

    // type ReactNode = ReactElement | string | number | …
    ReactNode: mkFixedName('React$Node'), // TODO use import

    PropsWithChildren: substitutePropsWithChildren,
    PropsWithoutRef: substitutePropsWithoutRef,

    MutableRefObject: substituteMutableRefObject,
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
    MemoExoticComponent: prepSubstituteType(
      `${prefix}Nop`,
      (name) => `type ${name}<+T> = T;`,
    ),

    // And NamedExoticComponent is the base interface of ForwardRefExoticComponent.
    NamedExoticComponent: mkFixedName('React$ComponentType'), // TODO use import

    ...prepSubstituteContext(),

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
