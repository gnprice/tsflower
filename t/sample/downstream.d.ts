import * as upstream from './upstream';
import { Num } from './upstream';
import type { Num as Numm } from './upstream';
import { x as ux } from './upstream';
import upstream2 from './upstream';
import type * as upstreamTypeOnly from './upstream';
import { C as UpC, type C as UpCT } from './upstream';
import type { C as UpCTT } from './upstream';
import { distantValue, distantType } from './upstream';
import { Component } from '../imported/minireact';

export { x, x as uux } from './upstream';
export { type Num } from './upstream'; // TODO wrong results: need exportKind
export type { Num as Nummm } from './upstream'; // TODO wrong results: need exportKind
// export * as up from "./upstream";  // TODO
export * from './upstream';

export declare type NumArray = Array<upstream.Num>;

declare const importType: {
  whole: typeof import('./upstream');
  value: typeof import('./upstream').x;
  subvalue: typeof import('./upstream').xx.y.z;

  type: import('./upstream').Num;
  typeArgs: import('./upstream').ArrayArray<number>;
  typeDefaultArgs: import('./upstream').ArrayArray2;
};

declare type TupleArray<T, S extends T> = [S, T[]][];

export declare const xx = 3;
export declare const y = 'a';
export declare const z: string = 'b';

export declare class C<T> {}
// export default class {} // TODO implement

declare function ff(x: boolean): void;

export {};
export { ff as fff, C as CC };

// declare const _default: upstream2.Num; // TODO doesn't resolve in Flow, though `upstream.Num` does
