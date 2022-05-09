import * as upstream from "./upstream";
import { Num } from "./upstream";
import type { Num as Numm } from "./upstream";
import { x as ux } from "./upstream";
import upstream2 from "./upstream";
import type * as upstreamTypeOnly from "./upstream";
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

export declare class C<T> {}
export declare class D extends C<string> {}

// export default class {} // TODO implement

declare function ff(x: boolean): void;

export {};
export { ff as fff, C as CC };

// declare const _default: upstream2.Num; // TODO doesn't resolve in Flow, though `upstream.Num` does
