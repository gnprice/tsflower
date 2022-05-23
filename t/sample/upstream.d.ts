export interface I {}

export class C {}

export declare type Num = number;
export declare type ArrayArray<T> = T[][];
export declare type ArrayArray2<T = string> = T[][];

export declare var x: Num;
export declare var xx: { y: { z: string } };

export { distantValue, distantType } from './upupstream';

var _default: { y: Num; z: { w: string } };
export default _default;
