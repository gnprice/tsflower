import * as upstream from "./upstream";

export declare type NumArray = Array<upstream.Num>;
export declare type RONumArray = ReadonlyArray<upstream.Num>;

declare type ArrayArray<T, S extends T> = [S, T[]][];

declare var a: string[], b: undefined;

export declare const _default: upstream.Num;

export default _default;
