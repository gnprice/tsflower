/**
 * Small utility functions inspired by TS's src/compiler/core.ts.
 *
 * The functions in that file are used all over the TS implementation.
 * They're convenient for coping with some conventions that show up in TS's
 * external API: for example, leaving out a property when semantically it
 * should be an empty array (which presumably they do as a performance
 * optimization.)
 *
 * Ideally we'd just import the functions directly, but they're not exported
 * from the package -- the whole file is marked internal.  So instead we
 * implement equivalent functions here.  They're small and self-contained.
 */

/** Like `Array#map`, but `undefined` produces `undefined`. */
export function map<T, U>(array: readonly T[], f: (x: T, i: number) => U): U[];
export function map<T, U>(
  array: readonly T[] | void,
  f: (x: T, i: number) => U
): U[] | void {
  if (!array) return undefined;
  return array.map(f);
}
