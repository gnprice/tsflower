import * as upstream from "./upstream";
import { Num } from "./upstream";
import type { Num as Numm } from "./upstream";
import { x as ux } from "./upstream";
import upstream2 from "./upstream";
import { C as UpC, type C as UpCT } from "./upstream";
import type { C as UpCTT } from "./upstream";
import { Component } from "../imported/upupstream";

export { x, x as uux } from "./upstream";
export { type Num } from "./upstream"; // TODO wrong results: need exportKind
export type { Num as Nummm } from "./upstream"; // TODO wrong results: need exportKind
// export * as up from "./upstream";  // TODO
export * from "./upstream";

export declare type NumArray = Array<upstream.Num>;

declare type ArrayArray<T, S extends T> = [S, T[]][];

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

export declare class C<T> {}
export declare class D extends C<string> {}

// export default class {} // TODO implement

declare function ff(x: boolean): void;

export {};
export { ff as fff, C as CC };

// declare const _default: upstream2.Num; // TODO doesn't resolve in Flow, though `upstream.Num` does
