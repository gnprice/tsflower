import ts from 'typescript';
import { namedTypes as n } from 'ast-types';
import K from 'ast-types/gen/kinds';
import { Converter, ErrorOr } from '../convert';

interface TypeRewriteBase {
  readonly kind: string;
}

// We don't actually currently use this kind of rewrite.  Leaving it in
// partly because its implementation is so simple that it's very cheap to
// keep around.
//
// Possibly we should use it after all for things like Readonly/$ReadOnly
// and ReadonlyArray/$ReadOnlyArray?  Seems like using the normal Flow names
// for such things could make the output more readable than following the TS
// names.  ... Or perhaps that should be done as a more general inlining
// feature on the subst mechanism, which could also be invoked on many
// definitions in React and React Native.
export interface FixedName extends TypeRewriteBase {
  readonly kind: 'FixedName';
  readonly name: string;
}

/**
 * Rename this type, both at its definition and references.
 *
 * Used in particular where TS has a type and value sharing a name, which
 * Flow doesn't permit.  The value keeps the name, and the type gets a new
 * one.
 *
 * There's an asymmetry here: we don't have a "RenameValue".  That's
 * because we're translating type definitions, but those type definitions
 * describe some actual runtime JS, which we don't modify (or even see),
 * and the value name is a real fact about that actual runtime JS.
 */
export interface RenameType extends TypeRewriteBase {
  readonly kind: 'RenameType';
  readonly name: string;
}

/**
 * Substitute this type, with a definition of our own.
 *
 * When translating a reference to this type, we'll emit a type-import of
 * the given imported name from the given module, and refer to that.
 *
 * The name must be distinct from any other substitution, and prefixed to
 * avoid collision with user code.
 *
 * TODO: Have the converter pick a unique name instead, with importedName
 *   as the first choice.
 */
export interface SubstituteType extends TypeRewriteBase {
  readonly kind: 'SubstituteType';
  readonly name: string;
  readonly importedName: string;
  readonly moduleSpecifier: string;
}

/**
 * Translate each reference to this type using the type arguments.
 */
export interface TypeMacro extends TypeRewriteBase {
  readonly kind: 'TypeMacro';
  readonly convert: (
    converter: Converter,
    typeArguments: ts.NodeArray<ts.TypeNode> | void,
  ) => ErrorOr<K.FlowTypeKind>;
}

export interface TypeReferenceMacro extends TypeRewriteBase {
  readonly kind: 'TypeReferenceMacro';
  readonly convert: (
    converter: Converter,
    typeName: ts.EntityNameOrEntityNameExpression,
    typeArguments: ts.NodeArray<ts.TypeNode> | void,
  ) => ErrorOr<{
    id: K.IdentifierKind | n.QualifiedTypeIdentifier;
    typeParameters: n.TypeParameterInstantiation | null;
  }>;
}

/**
 * What to do to rewrite some type.
 */
export type TypeRewrite =
  | FixedName
  | RenameType
  | SubstituteType
  | TypeMacro
  | TypeReferenceMacro;

export type NamespaceRewrite = {
  types?: Map<string, TypeRewrite>;
  namespaces?: Map<string, NamespaceRewrite>;
};

export function mkFixedName(name: string): FixedName {
  return { kind: 'FixedName', name };
}

export function mkSubstituteType(
  name: string,
  importedName: string,
  moduleSpecifier: string,
): SubstituteType {
  return { kind: 'SubstituteType', name, importedName, moduleSpecifier };
}

export function mkTypeMacro(convert: TypeMacro['convert']): TypeMacro {
  return { kind: 'TypeMacro', convert };
}

export function mkTypeReferenceMacro(
  convert: TypeReferenceMacro['convert'],
): TypeReferenceMacro {
  return { kind: 'TypeReferenceMacro', convert };
}

export function mapOfObject<T>(obj: {
  readonly [name: string]: T;
}): Map<string, T> {
  return new Map(Object.entries(obj));
}

export function mkNamespaceRewrite(
  types: void | { readonly [name: string]: TypeRewrite },
  namespaces?: void | { readonly [name: string]: NamespaceRewrite },
): NamespaceRewrite {
  const r: NamespaceRewrite = {};
  if (types) r.types = mapOfObject(types);
  if (namespaces) r.namespaces = mapOfObject(namespaces);
  return r;
}

export function prepImportSubstitute(
  importedName: string,
  localName: string,
  moduleSpecifier: string,
) {
  return mkSubstituteType(localName, importedName, moduleSpecifier);
}
