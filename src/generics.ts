/**
 * Assert a contradiction, statically.  Do nothing at runtime.
 *
 * The `never` type is the type with no values.  So, modulo bugs in TS,
 * `any` types, and ts-expect-error/ts-ignore markers, the only way a call
 * to this function can ever be valid is when the type-checker can actually
 * prove the call site is unreachable.
 *
 * Especially useful for statically asserting that a `switch` statement is
 * exhaustive:
 *
 *     type Foo =
 *       | { type: 'frob'; … }
 *       | { type: 'twiddle'; … };
 *
 *
 *     const foo: Foo = …;
 *     switch (foo.type) {
 *       case 'frob': …; break;
 *
 *       case 'twiddle': …; break;
 *
 *       default:
 *         ensureUnreachable(foo); // Asserts no possible cases for `foo` remain.
 *         return /* … some error value … * /;
 *     }
 *
 * In this example if by mistake a case is omitted, or if another case is
 * added to the type without a corresponding `case` statement here, then
 * TS will report a type error at the `ensureUnreachable` call.
 *
 * See `assertUnreachable` for a variant that will throw if the impossible
 * case is somehow reached.  Use that when there isn't an appropriate
 * more-specific way to signal an error.
 */
export function ensureUnreachable(_x: never) {}

/**
 * Like `ensureUnreachable`, but if the impossible happens, throw.
 *
 * If `description` is a function, it will be called with the impossible
 * value.  This, and the use there of `any`, is a workaround for TS
 * responding (illogically) to a pattern like:
 *
 *     switch (foo.kind) {
 *       // … cases …
 *       default:
 *         assertUnreachable(foo, `Foo kind: ${foo.kind}`);
 *     }
 *
 * with the complaint that `foo` has no property `kind`.  Instead, to use
 * the workaround, write:
 *
 *         assertUnreachable(foo, (foo) => `Foo kind: ${foo.kind}`);
 */
export function assertUnreachable(
  x: never,
  description: string | ((x: any) => string),
): never {
  const d = typeof description === "string" ? description : description(x);
  throw new Error(`internal error: unexpected ${d}`);
}
