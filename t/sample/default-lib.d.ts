/** Test rewrites of things from the TS default library. */

var readonly: {
  a: Readonly<{ a: string }>;
};

var readonlyArray: {
  a: ReadonlyArray<number>;
};

var record: {
  stringLiteral: Record<'a', number>;
  numberLiteral: Record<1, number>;

  string: Record<string, number>;
  number: Record<number, number>;

  unionStrings: Record<'a' | 'b', number>;
  unionNumbers: Record<1 | 2 | 3, number>;
  unionMixedAtoms: Record<'a' | 2, number>;
  unionAtomAndCategory: Record<'a' | number, number>;
  unionCategories: Record<string | number, number>;

  // Flow doesn't support symbols as object keys:
  //   https://github.com/facebook/flow/issues/3258
  // oneSymbol: Record<typeof Symbol.iterator, number>;
  // symbol: Record<symbol, number>;
  // unionSymbols: Record<typeof Symbol.iterator | typeof Symbol.match, number>;
  // unionMixedAtoms: Record<"a" | 2 | typeof Symbol.iterator, number>;
  // unionCategories: Record<string | symbol, number>;
  // unionAll: Record<string | number | symbol, number>;
};

var omit: {
  a: Omit<{ a: string; b: number }, 'a'>;
  b: Omit<{ a: string; b: number }, 'a' | 'c'>;
  c: Omit<{ a: string; b: number }, never>;
  d: Omit<{ a: string; b: number }, '12' | '😀'>;
};

// Test that rewrites apply in `extends`, as well as TypeReference
interface I extends ReadonlyArray<string> {}
// class C implements ReadonlyArray<string> {} // TODO class implements
