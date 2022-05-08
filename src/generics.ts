/**
 * Assert a contradiction, statically.  Do nothing at runtime.
 *
 * The `never` type is the type with no values.  So, modulo bugs in TS,
 * the only way a call to this function can ever be valid is when the
 * type-checker can actually prove the call site is unreachable.
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
 *         break;
 *     }
 *
 * In this example if by mistake a case is omitted, or if another case is
 * added to the type without a corresponding `case` statement here, then
 * TS will report a type error at the `ensureUnreachable` call.
 */
export function ensureUnreachable(_x: never) {}
