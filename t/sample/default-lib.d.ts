/** Test rewrites of things from the TS default library. */

var readonly: {
  a: Readonly<{ a: string }>;
};

var readonlyArray: {
  a: ReadonlyArray<number>;
};

var omit: {
  a: Omit<{ a: string; b: number }, "a">;
  b: Omit<{ a: string; b: number }, "a" | "c">;
  c: Omit<{ a: string; b: number }, never>;
  d: Omit<{ a: string; b: number }, "12" | "😀">;
};

// Test that rewrites apply in `extends`, as well as TypeReference
interface I extends ReadonlyArray<string> {}
// class C implements ReadonlyArray<string> {} // TODO class implements
