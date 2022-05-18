import ts from 'typescript';
import { builders as b, namedTypes as n } from 'ast-types';
import K from 'ast-types/gen/kinds';
import { Converter, ErrorOr, mkError, mkSuccess } from '../convert';
import {
  mkNamespaceRewrite,
  mkSubstituteType,
  mkTypeReferenceMacro,
  NamespaceRewrite,
} from './core';

const prefix = '$tsflower_subst$React$';

function prepImportSubstitute(tsName: string) {
  const localName = `${prefix}${tsName}`;
  return mkSubstituteType(localName, () => [
    b.importDeclaration(
      [
        b.importSpecifier.from({
          imported: b.identifier(tsName),
          local: b.identifier(localName),
          importKind: 'type',
        }),
      ],
      b.stringLiteral('tsflower/subst/react'),
    ),
  ]);
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

/**
 * Prepare our static rewrite plans for the 'react' module.
 */
export function prepReactRewrites(): NamespaceRewrite {
  // All from `@types/react/index.d.ts`.

  return mkNamespaceRewrite({
    Component: mkTypeReferenceMacro(convertReactComponent),
    FunctionComponent: mkTypeReferenceMacro(convertFunctionComponent),
    ReactElement: mkTypeReferenceMacro(convertReactElement),

    // TODO: Have the mapper find these import substitutions directly from
    //   the declarations in subst/react.js.flow, rather than list them here
    ...Object.fromEntries(
      [
        'ComponentProps',
        'ReactNode',
        'PropsWithChildren',
        'PropsWithoutRef',
        'MutableRefObject',
        'RefObject',
        'Ref',
        'RefAttributes',
        'ForwardRefExoticComponent',
        'MemoExoticComponent',
        'NamedExoticComponent',
        'ProviderProps',
        'ConsumerProps',
        'Provider',
        'Consumer',
        'Context',
      ].map((name) => [name, prepImportSubstitute(name)]),
    ),

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
