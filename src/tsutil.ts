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
