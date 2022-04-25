import * as upstream from "./upstream";

export declare type NumArray = Array<upstream.Num>;
export declare type RONumArray = ReadonlyArray<upstream.Num>;

declare type ArrayArray<T, S extends T> = [S, T[]][];

declare var a: undefined, b: void, c: boolean, d: number, e: string;
var f: null, g: true, h: false, i: 3, j: "x";
var k: boolean[], l: "a" | 3;
var m: (x: string, y, ...b: boolean[]) => number;
var n: (a: string, b?: number) => void;

declare function f(x: boolean): (b: true) => { y: number } {
};

export declare const _default: upstream.Num;

export default _default;
