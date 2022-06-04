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

export type TT = {
  x: {
    y: {
      /** About
 z */
      z: number;
    };
  };
};

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
