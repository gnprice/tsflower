/** Toplevel jsdoc (keep) */

/* eslint-disable  */
/*! Pinned comment (keep) */   /** Here's some jsdoc (keep) */

/* Block implementation comment (DROP) */
export declare type T = number; /** more on T (keep) */

export type U = /** a TODO missing because "trailing" the `=` */ 'a' | 'b' /** b (keep) */ | 'c';
export type U1 =
 /** a (keep) */ 'a' | 'b' /** b (keep) */ | 'c';
export type U2 =
 | /** a TODO missing because "trailing" the `|` */ 'a' | 'b' /** b (keep) */ | 'c';
export type U3 =
 | /** a TODO missing
  because still "trailing" */ 'a' | 'b' /** b (keep) */ | 'c';

export type LongLengthyProfuselyVerboselyNamedTypeCalledT<
  /** JsDoc on type parameter S (keep) */
  S
> = {
  x: {
    y: {
      /**
       * z of the y.
       *
       * Details about z
       * (keep)
       */
      z: S;
    };
  };
};

export type S = LongLengthyProfuselyVerboselyNamedTypeCalledT<{
  /** Some jsdoc on this property (keep) */
  a1: LongLengthyProfuselyVerboselyNamedTypeCalledT<
      { 
        /**
         * Some jsdoc on this inner property.  How does it indent? (keep)
         */
        x: number;
        y: void;
      },
    >;
}>;

/** Stray jsdoc (keep) */
// Stray comment (DROP)
/**
 * A function.
 *
  @param x an argument

  (keep)
 */
// An implementation comment. (DROP)
/// A triple-slash comment. (DROP)
export declare function f(
  /** About parameter x (keep) */
  x: string,
);
