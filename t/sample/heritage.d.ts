/**
 * Tests of 'extends' and 'implements' on classes and interfaces.
 *
 * Naturally these get exercised in tests about other things too.
 * In particular default-lib.d.ts and react.d.ts test their interaction
 * with our rewriting (of references with external translation).
 */

// Class extends.

export declare class C {}
export declare class C1<T = number> {}

export declare class D1 extends C1<string> {}

export declare class D0 extends C1 {} // should become C1<>
export declare class D extends C {} // … while this stays just C

// Interface extends.

export declare interface I {}
export declare interface I1<T = number> {}

export declare interface J1 extends I1<string> {}
export declare interface J extends I, I1 {} // should become I, I1<>

// Class implements.

export declare class CC1 implements I, I1 {} // should become I, I1<>
export declare class CC2 extends CC1 implements J {}
