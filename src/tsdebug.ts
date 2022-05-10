/**
 * Debugging tools inspired or copied from TS's implementation.
 *
 * Particularly from `src/compiler/debug.ts`, in the `ts.Debug` namespace.
 */
// Portions of this file (those copied from the TS implementation; see Git
// history) are copyright Microsoft Corporation.  But they have the same
// Apache-2.0 license as the rest of TsFlower.

import ts from "typescript";

/**
 * Formats an enum value as a string for debugging and debug assertions.
 */
export function formatEnum(value = 0, enumObject: any, isFlags?: boolean) {
  const members = getEnumMembers(enumObject);
  if (value === 0) {
    return members.length > 0 && members[0][0] === 0 ? members[0][1] : "0";
  }
  if (isFlags) {
    let result = "";
    let remainingFlags = value;
    for (const [enumValue, enumName] of members) {
      if (enumValue > value) {
        break;
      }
      if (enumValue !== 0 && enumValue & value) {
        result = `${result}${result ? "|" : ""}${enumName}`;
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
  for (const name in enumObject) {
    const value = enumObject[name];
    if (typeof value === "number" && !known.has(value)) {
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
