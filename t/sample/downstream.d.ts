import * as upstream from "./upstream";
import upstream2, { Num as Numm } from "./upstream";

export declare type NumArray = Array<upstream.Num>;
export declare type RONumArray = ReadonlyArray<Numm>;

declare type ArrayArray<T, S extends T> = [S, T[]][];

declare var a: undefined, b: void, c: boolean, d: number, e: string;
var f: null, g: true, h: false, i: 3, j: "x";
var k: boolean[], l: "a" | 3;
var m: (x: string, y, ...b: boolean[]) => number;
var n: (a: string, b?: number) => void;
var nn: <T>(x: T) => T[];
var o: {
  // prettier-ignore
  a: (number);
  b: object;
  c: unknown;
  d: any;
  e: never;
  // f: <T>(x: T) => T[];  // TODO: recast.print produces invalid syntax
  g: { a: string }["a"];
  h: Omit<{ a: string; b: number }, "a">;
  i: Omit<{ a: string; b: number }, "a" | "c">;
  j: Omit<{ a: string; b: number }, never>;
  k: Omit<{ a: string; b: number }, "12" | "😀">;
};

declare function f<T>(x: T): { y: T };

// TODO Function returning a function type:
//   declare function f(x: boolean): (b: true) => { y: number };
// Seems to be a bug in recast.print -- produces invalid syntax.

export declare class C<T> {}
export declare class D extends C<string> {
  // constructor();  // TODO: recast.print produces invalid syntax
  // f(cb: (s: string) => void): this;  // TODO implement
}

// export default class {} // TODO implement

declare const _default: upstream2.Num;
// export default _default;  // collides with other default
