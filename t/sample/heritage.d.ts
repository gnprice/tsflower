/**
 * Tests of 'extends' and 'implements' on classes and interfaces.
 *
 * Naturally these get exercised in tests about other things too.
 * In particular default-lib.d.ts and react.d.ts test their interaction
 * with our rewriting (of references with external translation).
 */

export declare class C<T> {}
export declare class D extends C<string> {}
