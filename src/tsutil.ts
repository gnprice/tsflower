/**
 * Small utility functions for working with TypeScript's ASTs.
 *
 * These are broadly in the spirit of utility functions found in the TS
 * implementation itself, but not necessary inspired by specific functions
 * there.
 */

import ts from 'typescript';
import { isArray, some } from './util';

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
  if (ts.isQualifiedName(node)) {
    return isEntityNameOrEntityNameExpression(node.left);
  }
  if (ts.isPropertyAccessExpression(node)) {
    return (
      ts.isIdentifier(node.name) &&
      isEntityNameOrEntityNameExpression(node.expression)
    );
  }
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

/**
 * Compare the nodes as pure ASTs, without location or checker/binder metadata.
 */
// This is written from scratch; there doesn't appear to be anything in the
// TS implementation to do a similar sort of job.  Inspired loosely by
// `ts.forEachChild`, which it also calls, and `forEachChildRecursively`.
export function equivalentNodes(nodeA: ts.Node, nodeB: ts.Node) {
  // Equivalent nodes must have the same kind.
  if (nodeA.kind !== nodeB.kind) return false;

  // We'll use ts.forEachChild to do most of the work.  But there are some
  // properties it doesn't cover, because they aren't themselves `ts.Node`s:
  //  * values of identifiers and literals
  //  * tokens represented directly by SyntaxKind values
  //
  // For a list of most of the latter:
  //   $ grep -PB3 '^\s*(readonly\s+)?(?!kind)\w+: SyntaxKind' src/compiler/types.ts
  // That list misses some like PrefixUnaryExpression#operator that use aliases.
  // Found some more like this:
  //   $ grep -iPB3 '^\s*(readonly\s+)?\w*(operator|token)\w*: ' src/compiler/types.ts
  // TODO: Audit more completely.
  if (ts.isLiteralExpression(nodeA)) {
    return nodeA.text === (nodeB as ts.LiteralExpression).text;
  }
  switch (nodeA.kind) {
    // TODO TemplateHead, TemplateMiddle, TemplateTail

    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.PrivateIdentifier:
      return (
        (nodeA as ts.Identifier | ts.PrivateIdentifier).text ===
        (nodeB as ts.Identifier | ts.PrivateIdentifier).text
      );
    case ts.SyntaxKind.TypeOperator:
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.PostfixUnaryExpression:
      return (
        // prettier-ignore
        (nodeA as ts.TypeOperatorNode | ts.PrefixUnaryExpression | ts.PostfixUnaryExpression).operator ===
          (nodeB as ts.TypeOperatorNode | ts.PrefixUnaryExpression | ts.PostfixUnaryExpression).operator &&
        equivalentChildren()
      );
    case ts.SyntaxKind.MetaProperty:
      return (
        (nodeA as ts.MetaProperty).keywordToken ===
          (nodeB as ts.MetaProperty).keywordToken && equivalentChildren()
      );
    case ts.SyntaxKind.HeritageClause:
      return (
        (nodeA as ts.HeritageClause).token ===
          (nodeB as ts.HeritageClause).token && equivalentChildren()
      );
    default:
      return equivalentChildren();
  }

  function equivalentChildren() {
    const childrenA = gatherChildren(nodeA);
    const childrenB = gatherChildren(nodeB);
    if (childrenA === childrenB) return true; // both undefined
    if (!childrenA || !childrenB) return false; // is this even possible?
    if (childrenA.length !== childrenB.length) return false; // is this even possible?
    for (let i = 0; i < childrenA.length; i++) {
      const itemA = childrenA[i];
      const itemB = childrenB[i];
      if (itemA === itemB) continue; // both undefined
      if (!itemA || !itemB) return false; // one undefined
      if (isArray(itemA)) {
        if (!isArray(itemB)) return false; // is this even possible?
        if (itemA.length !== itemB.length) return false;
        for (let i = 0; i < itemA.length; i++) {
          if (!equivalentNodes(itemA[i], itemB[i])) return false;
        }
      } else {
        if (isArray(itemB)) return false; // is this even possible?
        if (!equivalentNodes(itemA, itemB)) return false;
      }
    }
    return true;
  }

  function gatherChildren(
    node: ts.Node,
    // I don't understand how TS can be so very bad at type inference.
    // But it is, so we need to say this type three times.
    // (If e.g. you leave out the return type but have the other two copies,
    // it infers the return type is `void`.  Which is outright unsound.)
  ): void | (void | ts.Node | ts.NodeArray<ts.Node>)[] {
    let result: void | (void | ts.Node | ts.NodeArray<ts.Node>)[] = undefined;
    const push = (x: void | ts.Node | ts.NodeArray<ts.Node>) =>
      (result || (result = [])).push(x);
    ts.forEachChild(node, push, push);
    return result;
  }
}

/** Like checker.getAliasedSymbol, but doesn't barf if there's nothing to do. */
export function getAliasedSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): ts.Symbol {
  if (!(symbol.flags & ts.SymbolFlags.Alias)) return symbol;
  return checker.getAliasedSymbol(symbol);
}
