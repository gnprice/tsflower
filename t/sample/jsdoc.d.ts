/** Toplevel. */

/* eslint-disable  */
/*! Pinned comment. */   /** Here's some jsdoc. */

/* Block implementation comment. */
export declare type T = number; /** more on T */

export type U = /** a TODO missing because "trailing" */ 'a' | 'b' /** b */ | 'c';
export type U1 =
 /** a */ 'a' | 'b' /** b */ | 'c';
export type U2 =
 | /** a TODO missing because "trailing" */ 'a' | 'b' /** b */ | 'c';
export type U3 =
 | /** a TODO missing
  because "trailing" */ 'a' | 'b' /** b */ | 'c';

export type LongLengthyProfuselyVerboselyNamedTypeCalledT<
  /** JsDoc on type parameter S */
  S
> = {
  x: {
    y: {
      /**
       * z of the y.
       *
       * Details about z
       */
      z: S;
    };
  };
};

export type S = LongLengthyProfuselyVerboselyNamedTypeCalledT<{
  /** Some jsdoc on this property */
  a1: LongLengthyProfuselyVerboselyNamedTypeCalledT<
      { 
        /**
         * Some jsdoc on this inner property.  How does it indent?
         */
        x: number;
        y: void;
      },
    >;
}>;

/** Stray jsdoc */
// Stray comment
/**
 * A function.
 *
  @param x an argument
 */
// An implementation comment.
/// A triple-slash comment.
export declare function f(
  /** About parameter x */
  x: string,
);
