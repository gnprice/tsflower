/** Test rewrites of things from the TS default library. */

var readonly: {
  a: Readonly<{ a: string }>;
};

var readonlyArray: {
  a: ReadonlyArray<number>;
};

var partial: {
  a: Partial<{ x: number; y?: string }>;
  b: Partial<{}>;
};

var record: {
  stringLiteral: Record<'a', number>;
  // TODO(test): more forms of number
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
// Though that's not much use when the base isn't itself an interface:
// Flow distinguishes interfaces from other types, and doesn't allow
// `implements` on non-interfaces.
//
// So although this would get rewritten, the result is still a Flow error:
//   class C implements ReadonlyArray<string> {}
// And even though interface-extends is allowed, if you then try to use
// that interface:
//   class C implements I {}
// you get the same `cannot-implement` error, referring back to
// $ReadOnlyArray.
//
// TODO(test): Add a better example, once we have a translation to something
//   flowlib does call an interface.  Perhaps Iterable/$Iterable,
//   or IterableIterator/$Iterator?  Or something in the DOM.
