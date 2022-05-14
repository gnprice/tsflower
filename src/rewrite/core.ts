import ts from "typescript";
import { builders as _b, namedTypes as n } from "ast-types";
import K from "ast-types/gen/kinds";
import { Converter, ErrorOr } from "../convert";

interface TypeRewriteBase {
  readonly kind: string;
}

export interface FixedName extends TypeRewriteBase {
  readonly kind: "FixedName";
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
  readonly kind: "RenameType";
  readonly name: string;
}

/**
 * Substitute this type, with a definition of our own.
 *
 * The substitute will define a type alias of the stated name (and
 * possibly additional definitions for its own internal use).  This will
 * accept exactly the same type arguments, or none, as the original.
 *
 * The name (and the names of any auxiliary definitions) must be distinct
 * from any other substitution, and prefixed to avoid collision with user
 * code.
 */
export interface SubstituteType extends TypeRewriteBase {
  readonly kind: "SubstituteType";
  readonly name: string;
  readonly substitute: () => K.StatementKind[];
}

export interface TypeReferenceMacro extends TypeRewriteBase {
  readonly kind: "TypeReferenceMacro";
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
  | TypeReferenceMacro;

export type NamespaceRewrite = {
  types?: Map<string, TypeRewrite>;
  namespaces?: Map<string, NamespaceRewrite>;
};

export function mkFixedName(name: string): FixedName {
  return { kind: "FixedName", name };
}

export function mkSubstituteType(
  name: string,
  substitute: () => K.StatementKind[],
): SubstituteType {
  return { kind: "SubstituteType", name, substitute };
}

export function mkTypeReferenceMacro(
  convert: TypeReferenceMacro["convert"],
): TypeReferenceMacro {
  return { kind: "TypeReferenceMacro", convert };
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
