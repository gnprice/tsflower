import * as upstream from "./upstream";
import { Num as Numm } from "./upstream";
import { x as ux } from "./upstream";
import upstream2 from "./upstream";
import { C as UpC, type C as UpCT } from "./upstream";
import type { C as UpCTT } from "./upstream" ;
import { Component } from "../imported/upupstream";

export { x, x as uux } from "./upstream";
export { type Num } from './upstream';  // TODO wrong results: need exportKind
export type { Num as Nummm } from "./upstream";  // TODO wrong results: need exportKind
// export * as up from "./upstream";  // TODO
export * from "./upstream";

export declare type NumArray = Array<upstream.Num>;

declare type ArrayArray<T, S extends T> = [S, T[]][];

declare var a: undefined, b: void, c: boolean, d: number, e: string;
var f: null, g: true, h: false, i: 3, j: "x";
var k: boolean[], l: "a" | 3, ll: { a: "a" | "b" } & { a: "b" | "c" };
var m: (x: string, y, ...b: boolean[]) => number;
var n: (a: string, b?: number) => void;
var nn: <T>(x: T) => T[];
var o: {
  // prettier-ignore
  a: (number); // With parens -- the TS parser has a node for them.
  b: object;
  c: unknown;
  d: any;
  e: never;
  f: <T>(x: T) => T[];
  g: { a: string }["a"];
  l: ({ x }: { x: number }) => number;
};
var oo: typeof o;
var oa: typeof o.a;
var ok: keyof typeof o;

declare function ff<T>(x: T): { y: T };

declare function ff(x: boolean): (b: true) => { y: number };
export declare function ff(x: boolean): (b: true) => { y: number };

export declare class C<T> {}
export declare class D extends C<string> {
  constructor(); // TODO: should return void, not any

  f(cb: (s: string) => void): void;
  g(other: this): this;
  // 'import'(cb: (s: string) => void): this;  // TS supports this, but Flow has no equivalent.

  x;
  y: this;
  z?;
  w?: number;
  // TODO implement
  // 3: string;
  // 'extends': string;
  // [3]: string;
  // ['extends']: string;
}

// export default class {} // TODO implement

declare interface I {
  f(cb: (s: string) => void): void;

  x;
  z?;
  w?: number;
}

export { };
export { ff as fff, C as CC };

// declare const _default: upstream2.Num; // TODO doesn't resolve in Flow, though `upstream.Num` does
