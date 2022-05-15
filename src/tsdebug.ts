/**
 * Debugging tools inspired or copied from TS's implementation.
 *
 * Particularly from `src/compiler/debug.ts`, in the `ts.Debug` namespace.
 */
// Portions of this file (those copied from the TS implementation; see Git
// history) are copyright Microsoft Corporation.  But they have the same
// Apache-2.0 license as the rest of TsFlower.

/* eslint-disable spaced-comment */

import ts from 'typescript';
import { isGeneratedIdentifier } from './tsutil';
import { map } from './util';

export function formatSymbol(symbol: void | ts.Symbol): string {
  if (!symbol) return 'undefined';
  return `{ name: ${ts.unescapeLeadingUnderscores(
    symbol.escapedName,
  )}; flags: ${formatSymbolFlags(symbol.flags)}; declarations: ${map(
    symbol.declarations,
    (node) => formatSyntaxKind(node.kind),
  )} }`;
}

/**
 * Formats an enum value as a string for debugging and debug assertions.
 */
export function formatEnum(value = 0, enumObject: any, isFlags?: boolean) {
  const members = getEnumMembers(enumObject);
  if (value === 0) {
    return members.length > 0 && members[0][0] === 0 ? members[0][1] : '0';
  }
  if (isFlags) {
    let result = '';
    let remainingFlags = value;
    for (const [enumValue, enumName] of members) {
      if (enumValue > value) {
        break;
      }
      if (enumValue !== 0 && enumValue & value) {
        result = `${result}${result ? '|' : ''}${enumName}`;
        remainingFlags &= ~enumValue;
      }
    }
    if (remainingFlags === 0) {
      return result;
    }
  } else {
    for (const [enumValue, enumName] of members) {
      if (enumValue === value) {
        return enumName;
      }
    }
  }
  return value.toString();
}

// Simplified from the one in TS's implementation.
// We only actually need the first member with a given value, not the whole
// list of them, so can dispense with the stable sort.
function getEnumMembers(enumObject: any) {
  const result: [number, string][] = [];
  const known: Set<number> = new Set();
  /* eslint-disable-next-line guard-for-in */ // it's an enum, no prototype
  for (const name in enumObject) {
    const value = enumObject[name];
    if (typeof value === 'number' && !known.has(value)) {
      known.add(value);
      result.push([value, name]);
    }
  }

  return result;
}

export function formatSyntaxKind(kind: ts.SyntaxKind | undefined): string {
  return formatEnum(kind, ts.SyntaxKind, /*isFlags*/ false);
}

export function formatNodeFlags(flags: ts.NodeFlags | undefined): string {
  return formatEnum(flags, ts.NodeFlags, /*isFlags*/ true);
}

export function formatModifierFlags(
  flags: ts.ModifierFlags | undefined,
): string {
  return formatEnum(flags, ts.ModifierFlags, /*isFlags*/ true);
}

export function formatEmitFlags(flags: ts.EmitFlags | undefined): string {
  return formatEnum(flags, ts.EmitFlags, /*isFlags*/ true);
}

export function formatSymbolFlags(flags: ts.SymbolFlags | undefined): string {
  return formatEnum(flags, ts.SymbolFlags, /*isFlags*/ true);
}

export function formatTypeFlags(flags: ts.TypeFlags | undefined): string {
  return formatEnum(flags, ts.TypeFlags, /*isFlags*/ true);
}

export function formatObjectFlags(flags: ts.ObjectFlags | undefined): string {
  return formatEnum(flags, ts.ObjectFlags, /*isFlags*/ true);
}

export function formatFlowFlags(flags: ts.FlowFlags | undefined): string {
  return formatEnum(flags, ts.FlowFlags, /*isFlags*/ true);
}

// Adapted from the `__tsDebuggerDisplay` definition for nodes found in TS's
// `src/compiler/debug.ts`.
export function debugFormatNode(node: ts.Node): string {
  // prettier-ignore
  const nodeHeader =
    isGeneratedIdentifier(node) ? 'GeneratedIdentifier' :
    ts.isIdentifier(node) ? `Identifier '${ts.idText(node)}'` :
    ts.isPrivateIdentifier(node) ? `PrivateIdentifier '${ts.idText(node)}'` :
    ts.isStringLiteral(node) ? `StringLiteral ${
      JSON.stringify(node.text.length < 10 ? node.text : node.text.slice(10) + '...')
    }` :
    ts.isNumericLiteral(node) ? `NumericLiteral ${node.text}` :
    ts.isBigIntLiteral(node) ? `BigIntLiteral ${node.text}n` :
    ts.isTypeParameterDeclaration(node) ? 'TypeParameterDeclaration' :
    ts.isParameter(node) ? 'ParameterDeclaration' :
    ts.isConstructorDeclaration(node) ? 'ConstructorDeclaration' :
    ts.isGetAccessorDeclaration(node) ? 'GetAccessorDeclaration' :
    ts.isSetAccessorDeclaration(node) ? 'SetAccessorDeclaration' :
    ts.isCallSignatureDeclaration(node) ? 'CallSignatureDeclaration' :
    ts.isConstructSignatureDeclaration(node) ? 'ConstructSignatureDeclaration' :
    ts.isIndexSignatureDeclaration(node) ? 'IndexSignatureDeclaration' :
    ts.isTypePredicateNode(node) ? 'TypePredicateNode' :
    ts.isTypeReferenceNode(node) ? 'TypeReferenceNode' :
    ts.isFunctionTypeNode(node) ? 'FunctionTypeNode' :
    ts.isConstructorTypeNode(node) ? 'ConstructorTypeNode' :
    ts.isTypeQueryNode(node) ? 'TypeQueryNode' :
    ts.isTypeLiteralNode(node) ? 'TypeLiteralNode' :
    ts.isArrayTypeNode(node) ? 'ArrayTypeNode' :
    ts.isTupleTypeNode(node) ? 'TupleTypeNode' :
    ts.isOptionalTypeNode(node) ? 'OptionalTypeNode' :
    ts.isRestTypeNode(node) ? 'RestTypeNode' :
    ts.isUnionTypeNode(node) ? 'UnionTypeNode' :
    ts.isIntersectionTypeNode(node) ? 'IntersectionTypeNode' :
    ts.isConditionalTypeNode(node) ? 'ConditionalTypeNode' :
    ts.isInferTypeNode(node) ? 'InferTypeNode' :
    ts.isParenthesizedTypeNode(node) ? 'ParenthesizedTypeNode' :
    ts.isThisTypeNode(node) ? 'ThisTypeNode' :
    ts.isTypeOperatorNode(node) ? 'TypeOperatorNode' :
    ts.isIndexedAccessTypeNode(node) ? 'IndexedAccessTypeNode' :
    ts.isMappedTypeNode(node) ? 'MappedTypeNode' :
    ts.isLiteralTypeNode(node) ? 'LiteralTypeNode' :
    ts.isNamedTupleMember(node) ? 'NamedTupleMember' :
    ts.isImportTypeNode(node) ? 'ImportTypeNode' :
  formatSyntaxKind(node.kind);
  return `${nodeHeader}${
    node.flags ? ` (${formatNodeFlags(node.flags)})` : ''
  }`;
}

// Adapted from the `__tsDebuggerDisplay` definition for types found in TS's
// `src/compiler/debug.ts`.
export function debugFormatType(type: ts.Type): string {
  /* eslint-disable max-len */
  // prettier-ignore
  const typeHeader =
    // type.flags & ts.TypeFlags.Nullable ? "NullableType" :
    type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined) ? "NullableType" :
    type.flags & ts.TypeFlags.StringOrNumberLiteral ? `LiteralType ${
      JSON.stringify((type as ts.LiteralType).value)}` :
    type.flags & ts.TypeFlags.BigIntLiteral ? `LiteralType ${
        (type as ts.BigIntLiteralType).value.negative ? "-" : ""
      }${(type as ts.BigIntLiteralType).value.base10Value}n` :
    type.flags & ts.TypeFlags.UniqueESSymbol ? "UniqueESSymbolType" :
    type.flags & ts.TypeFlags.Enum ? "EnumType" :
    // type.flags & ts.TypeFlags.Intrinsic ? `IntrinsicType ${
    //   (type as ts.IntrinsicType).intrinsicName}` :
    type.flags & ts.TypeFlags.Union ? "UnionType" :
    type.flags & ts.TypeFlags.Intersection ? "IntersectionType" :
    type.flags & ts.TypeFlags.Index ? "IndexType" :
    type.flags & ts.TypeFlags.IndexedAccess ? "IndexedAccessType" :
    type.flags & ts.TypeFlags.Conditional ? "ConditionalType" :
    type.flags & ts.TypeFlags.Substitution ? "SubstitutionType" :
    type.flags & ts.TypeFlags.TypeParameter ? "TypeParameter" :
    type.flags & ts.TypeFlags.Object ?
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.ClassOrInterface ? "InterfaceType" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference ? "TypeReference" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Tuple ? "TupleType" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Anonymous ? "AnonymousType" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Mapped ? "MappedType" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.ReverseMapped ? "ReverseMappedType" :
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.EvolvingArray ? "EvolvingArrayType" :
        "ObjectType" :
    "Type";
  /* eslint-enable max-len */
  const kObjectTypeKindMask = // ts.ObjectFlags.ObjectTypeKindMask
    ts.ObjectFlags.ClassOrInterface |
    ts.ObjectFlags.Reference |
    ts.ObjectFlags.Tuple |
    ts.ObjectFlags.Anonymous |
    ts.ObjectFlags.Mapped |
    ts.ObjectFlags.ReverseMapped |
    ts.ObjectFlags.EvolvingArray;
  const remainingObjectFlags =
    type.flags & ts.TypeFlags.Object
      ? (type as ts.ObjectType).objectFlags & ~kObjectTypeKindMask
      : 0;
  return `${typeHeader}${
    type.symbol ? ` '${ts.symbolName(type.symbol)}'` : ''
  }${
    remainingObjectFlags ? ` (${formatObjectFlags(remainingObjectFlags)})` : ''
  }`;
}

// This isn't copied from anything in the TS implementation, but has a
// similar flavor to the other helpers in this file.
export function formatEntityNameExpression(
  name: ts.EntityNameExpression,
): string {
  if (ts.isIdentifier(name)) return name.text;
  return `${formatEntityNameExpression(name.expression)}.${name.name.text}`;
}
