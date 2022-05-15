/**
 * Tests of 'extends' and 'implements' on classes and interfaces.
 *
 * Naturally these get exercised in tests about other things too.
 * In particular default-lib.d.ts and react.d.ts test their interaction
 * with our rewriting (of references with external translation).
 */
import * as React from 'react';

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

// Class extends, where the base isn't declared as a class.

export declare class CC3 extends React.Component {}
export declare var NN: { O: { P: typeof React.Component } };
// export declare class CC4 extends NN.O.P {} // TODO: should become NN.O.P<{ ... }>

// Class extends, where the type and value come apart.

import { B } from '../imported/heritage-external';
class Derived extends B {}
