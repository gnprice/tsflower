import { B as extB, C as extC } from '../imported/heritage-external';
import * as ext from '../imported/heritage-external';

declare type A<T, S = string, R = (arg: T) => S> = R;
// export var a1: A; // invalid TS
// export var a2: A<>; // invalid TS
export var a3: A<number>;
export var a4: A<number, boolean>;
export var a5: A<number, boolean, null>;

declare type B<T = void, S = string, R = (arg: T) => S> = R;
export var b1: B; // This is valid TS, but in Flow must be spelled `B<>`.
// export var b2: B<>;  // This is invalid TS.
export var b3: B<number>;
export var b4: B<number, boolean>;
export var b5: B<number, boolean, null>;

export var extb1: extB; // should gain <>
export var extb2: ext.B; // should gain <>
export var extc1: extC; // should remain as is
export var extc2: ext.C; // should remain as is
