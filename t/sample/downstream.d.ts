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
  subvalue: typeof import('./upstream').anObject.y.z;

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

import type { anObject } from './upstream';
import { type anObject as anObject2 } from './upstream';
// prettier-ignore
type v1<T extends typeof anObject = { y: { z: string } },
        U extends { y: { z: string } } = typeof anObject> = void;
// prettier-ignore
type v2<T extends typeof anObject2 = { y: { z: string } },
        U extends { y: { z: string } } = typeof anObject2> = void;
// prettier-ignore
type v3<T extends typeof anObject.y = { z: string },
        U extends { z: string } = typeof anObject.y> = void;
// prettier-ignore
type v4<T extends typeof anObject2.y.z = string,
        U extends string = typeof anObject2.y.z> = void;

export {};
export { ff as fff, C as CC };

// declare const _default: upstream2.Num; // TODO doesn't resolve in Flow, though `upstream.Num` does
