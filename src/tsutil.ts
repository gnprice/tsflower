/**
 * Small utility functions for working with TypeScript's ASTs.
 *
 * These are broadly in the spirit of utility functions found in the TS
 * implementation itself, but not necessary inspired by specific functions
 * there.
 */

import ts from 'typescript';
import { some } from './util';

export function hasModifier(
  node: ts.Node,
  modifier: ts.ModifierSyntaxKind,
): boolean {
  return some(node.modifiers, (mod) => mod.kind === modifier);
}

// Inspired by TS's isEntityNameExpression in src/compiler/utilities.ts.
export function isEntityNameOrEntityNameExpression(
  node: ts.Node,
): node is ts.EntityNameOrEntityNameExpression {
  if (ts.isIdentifier(node)) return true;
  if (ts.isQualifiedName(node))
    return isEntityNameOrEntityNameExpression(node.left);
  if (ts.isPropertyAccessExpression(node))
    return (
      ts.isIdentifier(node.name) &&
      isEntityNameOrEntityNameExpression(node.expression)
    );
  return false;
}

// Based on TS's isNamedDeclaration in src/compiler/utilitiesPublic.ts.
export function isNamedDeclaration(
  node: ts.Node,
): node is ts.NamedDeclaration & { name: ts.DeclarationName } {
  // A comment in TS's own isNamedDeclaration says:
  //   > A 'name' property should always be a DeclarationName.
  return !!(node as ts.NamedDeclaration).name;
}

export function getModuleSpecifier(node: ts.ImportDeclaration): string {
  // JSDoc on ImportDeclaration#moduleSpecifier says:
  //   > If this is not a StringLiteral it will be a grammar error.
  return (node.moduleSpecifier as ts.StringLiteral).text;
}

// Adapted from TS's version in src/compiler/utilitiesPublic.ts.
export function isGeneratedIdentifier(
  node: ts.Node,
): node is ts.Identifier & { autoGenerateFlags: ts.GeneratedIdentifierFlags } {
  if (!ts.isIdentifier) return false;

  const KindMask = 7; // ts.GeneratedIdentifierFlags.KindMask
  const { autoGenerateFlags } = node as ts.Identifier & {
    autoGenerateFlags?: ts.GeneratedIdentifierFlags;
  };
  const kind = autoGenerateFlags! & KindMask;
  return kind > ts.GeneratedIdentifierFlags.None;
}
