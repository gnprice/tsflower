/**
 * Small utility functions for working with TypeScript's ASTs.
 *
 * These are broadly in the spirit of utility functions found in the TS
 * implementation itself, but not necessary inspired by specific functions
 * there.
 */

import ts from "typescript";
import { some } from "./util";

export function hasModifier(
  node: ts.Node,
  modifier: ts.ModifierSyntaxKind
): boolean {
  return some(node.modifiers, (mod) => mod.kind === modifier);
}

// Inspired by TS's isEntityNameExpression in src/compiler/utilities.ts.
export function isEntityNameOrEntityNameExpression(
  node: ts.Node
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

export function getModuleSpecifier(node: ts.ImportDeclaration): string {
  // JSDoc on ImportDeclaration#moduleSpecifier says:
  //   > If this is not a StringLiteral it will be a grammar error.
  return (node.moduleSpecifier as ts.StringLiteral).text;
}