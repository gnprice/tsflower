This file has some scratch notes on the design of the mapper.


# What do we want when we see a reference to a name?

* Some references are in pure value position.  We don't touch those,
  because those names are real facts about the JS.  This includes:

  * normal variable references

  * named imports, when the resolved symbol is a value but not a type

  * the argument to `typeof` as represented by TypeQueryNode,
    i.e. consisting of dot-separated identifiers like `typeof Foo.Bar`
    (plus possibly type arguments)

  * the argument to `typeof` as represented by ImportTypeNode,
    i.e. `typeof import(…)` possibly followed by dot-preceded
    identifiers (plus possibly type arguments); though we do have to
    rewrite the `import(…)` part to an `import` statement, as the only
    Flow equivalent


* Some references are in pure type position.  Here the input is a fact
  about the TS type definitions, and the output is a fact about the
  Flow type definitions.  That means:

  * When the reference is to another file TsFlower will be acting on,
    then we control both declaration and reference in the output.

    It's nice to use the same name where possible -- in particular, if
    the declaration is exported for use outside the library, then
    using the same name is very helpful for the actual Flow codebase
    that's ultimately consuming the type definitions TsFlower
    produces.  But in some cases that's not possible: when the type's
    name collides with that of a value (which Flow doesn't allow), or
    when the type is inside a namespace (which Flow doesn't have.)
    Then it's up to us to rename the declaration, and to rewrite the
    reference to match.

  * When the reference is to a file where the corresponding Flow type
    definitions are outside of TsFlower's control, we have to
    translate the reference to the best equivalent we can in terms of
    the Flow type definitions.  This includes:

    * The TS default library, translating to the Flow builtins and to
      our own constructions in terms of Flow primitives

    * React as described in `@types/react`, translating to Flow's
      types for React (which are partly intrinsics and partly in
      flowlib's `react.js`)

    * React Native as described in `@types/react-native`, translating
      to React Native's actual types (from its actual implementation,
      which is in Flow)

    * Possibly other libraries -- e.g., Node is described both in
      `@types/node` and in flowlib

  * Further, when the reference starts with `import(…)` -- i.e. is an
    ImportTypeNode -- there is no direct equivalent of that construct
    in Flow, and we have to replace it with an import statement.  This
    has no effect on the exported types, though.

  References in pure type position include:

  * plain type references, TypeReferenceNode (including those with
    type arguments)

  * named imports, when the resolved symbol is a type but not a value

  * interface-extends and class-implements


* Some references are in type *and* value position.  This means:

  * We can't rewrite the name -- it's a real fact about the JS.

    * Though in the case of an import, we can split it up: one import
      for the value, one for the type.  We can't do that for a class,
      but must do it for e.g. a type alias `type … =` sharing its name
      with a variable `const … =`.

  * If the declaration is in a file TsFlower will be acting on, then
    that's that; we'll emit a declaration taking equivalent type
    parameters.

  * But if the declaration is in a file where the corresponding Flow
    is outside our control, then the type parameters may not line up
    verbatim and may require rewriting.

    * For example, `React.Component` is a class, hence a value, with
      the same name in both `@types/react` and flowlib.  But the first
      type parameter defaults to `{}` in the former and is required in
      the latter.  Hence the rewrite we have for it.

  References in hybrid type/value position include:

  * class-extends

  * named imports, where the resolved symbol is both a type and a
    value


## Fun questions that may complicate the above picture

* Re-exports.  These probably behave a lot like imports.

* Must a class-extends be of a class?  Or could it also be of
  something declared as, say, both a function and an interface?  If
  the latter, then we'd rename the interface, and split up any import
  to import both separately... and then when we try to extend from it,
  what should that say?


# What can a type reference look like?

## Pure type references

A *pure* type reference is a dotted chain where (a) the last element
is a type; (b) the first element, if not also last, is either a module
or a namespace; and (c) any intermediate elements are namespaces.

Working that out in detail:

* It's a dotted chain.

  * In TypeReferenceNode, `.typeName` is an EntityName.

  * In a named import (an ImportSpecifier), the `propertyName ?? name`
    is just an Identifier.

  * In a HeritageClause (so interface-extends, class-implements, or
    class-extends)… hmm, well, the types say its `.expression` is a
    PropertyAccessExpression, which is more general -- the left of the
    dot can be any LeftHandSideExpression.  But then the logic in
    convertClassLikeDeclaration gives error (not "unimplemented") if
    it's not an EntityNameExpression, which means it's just a dotted
    name after all (that is, the left is just another
    PropertyAccessExpression until it's an Identifier.)  That
    indicates I concluded TS requires it to be that way.  But OTOH I
    don't seem to have a comment explaining how I reached that
    conclusion.

    … OK, on further study: this is true of the pure type positions,
    interface-extends and class-implements.  Demo:

        export interface I<T> { f(): T }
        export type II<T> = { i: I<T[]> }
        export type III = { i: I<number[]> }
        export interface J1 extends I<number> {}
        export interface J2 extends II<number>.i {}  // error
        export interface J3 extends III.i {}  // error
        export class E1 implements I<number> { f() { return 3 } }
        export class E2 implements II<number>.i { f() { return 3 } }  // error
        export class E3 implements III.i { f() { return 3 } }  // error

    The error messages for `II<number>.i` say it must be "an
    identifier/qualified-name with optional type arguments."

    Moreover for `III.i`, they say "'III' only refers to a type, but
    is being used as a namespace here."  So that confirms the nesting
    must be within a namespace -- not an `IndexedAccessTypeNode`,
    which has the same concrete syntax of dot-then-identifier.

    However, it is *not* true of class-extends, which is a hybrid
    type/value reference.  More below.

* The last element is a type, else it wouldn't work as a type
  reference.

* Any non-last elements are either modules or namespaces, because
  those are the only things a type can be nested in.

* Any non-first element isn't a module, because modules don't nest in
  anything else.  (Not via dotted-chain syntax, anyway; at
  module-resolution time, they have their own form of nesting.)


## Hybrid type/value references

These can be gnarlier.  Here's an example which both TS and Flow accept:

    export class C<T> { x: T[] = [] }
    export const N = { C }
    export const M = { N }
    export class D1 extends C<number> {}
    export class D2 extends N.C<number> {}
    export class D3 extends { ...M }['N'].C<number> {}

So it seems the class-extends `.expression` can truly be a property
access on an arbitrary expression.
