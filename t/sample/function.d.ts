/** Testing function types. */

var vRestParam: (x: string, y, ...b: boolean[]) => number;
var vOptionalParam: (a: string, b?: number) => void;
var vGeneric: <T>(x: T) => T[];
var vDestructuring: ({ x }: destructuringArgs) => void;

export declare var value: {
  pGeneric: <T>(x: T) => T[];
  pDestructuring: ({ x }: { x: number }) => number;
};

declare function ff<T>(x: T): { y: T };

declare function ff(x: boolean): (b: true) => { y: number };
export declare function ff(x: boolean): (b: true) => { y: number };

// declare function fDestructuring({ x }: destructuringArgs): void; // TODO(recast) produces broken syntax

type destructuringArgs = { x: boolean };
