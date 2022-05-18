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

const substitutePropsWithChildren = prepImportSubstitute(`PropsWithChildren`);

const substitutePropsWithoutRef = prepImportSubstitute(`PropsWithoutRef`);

const substituteMutableRefObject = prepImportSubstitute(`MutableRefObject`);

const substituteReactRefObject = prepImportSubstitute(`RefObject`);

const substituteReactRef = prepImportSubstitute(`Ref`);

const substituteReactRefAttributes = prepImportSubstitute(`RefAttributes`);

function prepSubstituteContext() {
  return {
    ProviderProps: prepImportSubstitute('ProviderProps'),
    ConsumerProps: prepImportSubstitute('ConsumerProps'),
    Provider: prepImportSubstitute('Provider'),
    Consumer: prepImportSubstitute('Consumer'),
    Context: mkFixedName('React$Context'),
  };
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

    ForwardRefExoticComponent: prepImportSubstitute(
      'ForwardRefExoticComponent',
    ),
    MemoExoticComponent: prepImportSubstitute('MemoExoticComponent'),
    NamedExoticComponent: prepImportSubstitute('NamedExoticComponent'),

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
    Element: prepImportSubstitute('JSX$Element'),
    // If adding to this: note the unimplemented cases in findGlobalRewrites,
    // where we use this map.
  });
}
