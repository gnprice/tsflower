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

var keywordTypes: {
  undef: undefined;
  void_: void;
  bool: boolean;
  num: number;
  str: string;
  obj: object;
  // for `this`, see members.d.ts
};

var literalTypes: {
  n: null;
  t: true;
  f: false;
  num: 3; // TODO also negative numbers, floats, exponential notation
  str: "x";
};

// type references covered in generics.d.ts

var typeOperations: {
  // prettier-ignore
  parens: (number); // The TS parser has a node for parens around a type.
  query: {
    l: typeof literalTypes;
    ln: typeof literalTypes.n;
  };
  keys: keyof typeof literalTypes;
  union: "a" | 3;
  intersection: { a: "a" | "b" } & { a: "b" | "c" };
  indexedAccess: { a: string }["a"];
  array: boolean[];
  tuple: [string, number];
  // function types covered in function.d.ts
  // type literals covered in members.d.ts (plus incidentally here)
};
