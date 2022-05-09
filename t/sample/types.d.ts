/**
 * Tests of simple and miscellaneous types.
 *
 * Some kinds of types have their own test files.  For example:
 *   function.d.ts
 *   members.d.ts
 *   generics.d.ts
 */

export declare type ArrayArray<T, S extends T> = [S, T[]][];

declare var a: undefined, b: void, c: boolean, d: number, e: string;
var f: null, g: true, h: false, i: 3, j: "x";
var k: boolean[], l: "a" | 3, ll: { a: "a" | "b" } & { a: "b" | "c" };
var o: {
  // prettier-ignore
  a: (number); // With parens -- the TS parser has a node for them.
  b: object;
  c: unknown;
  d: any;
  e: never;
  g: { a: string }["a"];
};
var oo: typeof o;
var oa: typeof o.a;
var ok: keyof typeof o;
