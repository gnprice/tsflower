/**
 * Tests of simple and miscellaneous types.
 *
 * Some kinds of types have their own test files.  For example:
 *   function.d.ts
 *   members.d.ts
 *   generics.d.ts
 */

export declare var latticeTypes: {
  unk: unknown;
  any_: any;
  nevr: never;
};

declare var keywordTypes: {
  undef: undefined;
  void_: void;
  bool: boolean;
  num: number;
  str: string;
  sym: symbol;
  obj: object;
  // for `this`, see members.d.ts
};

declare var literalTypes: {
  n: null;
  t: true;
  f: false;
  num: {
    nat: 3;
    neg: -1;
    float: 1.2;
    floatNeg: -2.3;
    expPIP: 1e2;
    expPFP: 1.2e3;
    expPIN: 1e-2;
    expPFN: 1.2e-3;
    expNIP: -1e2;
    expNFP: -1.2e3;
    expNIN: -1e-2;
    expNFN: -1.2e-3;
  };
  str: 'x';
};

// type references covered in generics.d.ts

declare var typeOperations: {
  // prettier-ignore
  parens: (number); // The TS parser has a node for parens around a type.
  query: {
    l: typeof literalTypes;
    ln: typeof literalTypes.n;
  };
  keys: keyof typeof literalTypes;
  union: 'a' | 3;
  intersection: { a: 'a' | 'b' } & { a: 'b' | 'c' };
  indexedAccess: { a: string }['a'];
  indexedKeys: {
    // These should become `$Values` calls, except those named "…Mismatch".
    typeof_: typeof literalTypes[keyof typeof literalTypes];
    typeofMismatch1: typeof literalTypes[keyof typeof literalTypes.n];
    typeofMismatch2: typeof literalTypes[keyof typeof keywordTypes];
    tparam: <T>(o: T) => T[keyof T];
    tparam2: <T, S>(o: T, p: S) => T[keyof T];
    tparamMismatch: <T, S>(o: T, p: S) => T[keyof S];
    obj1: { a: string }[keyof { a: string }];
    obj2: { a(): string }[keyof { a(): string }];
    objMismatch1: { a: string }[keyof { b: string }];
    objMismatch2: { a: string }[keyof { a(): string }];
  };
  array: boolean[];
  tuple: {
    zero: [];
    one: [string];
    two: [string, number];
    eight: [undefined, void, null, boolean, true, false, number, string];
    named: [name: string];
    named2: [key: string, value: number];
  };
  // function types covered in function.d.ts
  // type literals covered in members.d.ts (plus incidentally here)
};
