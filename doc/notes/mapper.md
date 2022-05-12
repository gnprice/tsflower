This file has some scratch notes on the design of the mapper.


# What do we want when we see a reference to a name?

## Type declarations (aliases, interfaces, enums, imports, exports)

We may need to rename these, if it's in a file we're translating:

* Rename to avoid collision with a value name.

* For types inside a namespace, rename to put at the top level of the
  module.  (Or of the global ambient "module", if that's where it is.)

* For enums, make a type alias with its own name, as well as a
  variable with the original name.

* For imports, follow any rename or split on the remote name.

  * Or if it's from a file TsFlower won't be operating on, then apply
    whatever translation we have for it -- which may be in another
    file entirely.

    … Or actually perhaps emit nothing for the import itself in this
    case.  Instead, when we handle an actual reference to the thing,
    add whatever imports we need to the preamble.  These might be
    none, if we just open-code the translation, or several, if we have
    to assemble it from multiple pieces.

    Possibly we'd want that translation to make its generated imports
    relative to the original import… but actually I think probably
    not.  If e.g. you for some reason import React from a specifier
    other than `'react'`, and we somehow recognize it as React and
    realize we need to translate the references accordingly, then I
    think we still want to import from `'react'` -- that's where Flow
    has the types we're trying to use, even if you've somehow arranged
    something odd on the TS side.

* For re-exports... is `export { T } from 'foo'` exactly equivalent to
  `import { T as $freshname } from 'foo'; export type T = $freshname`?
  (When `T` in `foo` is a pure type, that is, else mutatis mutandis.)
  If so, then that'd answer questions on how to handle it.

  For `export` modifying some declaration, I think we just handle the
  declaration the same as if it weren't exported.

  And `export default` can't be of a pure type.  Then I think that
  covers all exports.


## Type references, and pure-type heritage

This covers TypeReferenceNode, interface-extends, and
class-implements.  As explained below, these are:

  > a dotted chain where (a) the last element is a type; (b) the first
  > element, if not also last, is either a module or a namespace; and
  > (c) any intermediate elements are namespaces.

* If it's a plain identifier, i.e. a dotted chain with one element,
  then it's a type declared in this module (possibly by an import), or
  else as a global ambient declaration somewhere.

  We may have renamed it; that's a fact about this symbol, determined
  when we looked at its declaration.

  * Though if it's an import from a file we translate, we may not be
    able to do that until we've handled the remote declaration.  We
    can handle that by rescanning imports after we add renames, as
    with `findImportRenames` inside `createMapper`.

  * Hmm, what if it's a global ambient declaration we *are*
    translating?  Not sure yet how important that'll be as a use case,
    but certainly it'd be good in principle to do so.  (I guess it'd
    mean some output would have to go to a libdef file.)  I guess that
    doesn't change anything here, as long as the mapper sees all files
    before the converter starts going.

  Or it may be an import from a file with external translation.  We'll
  have determined that when we looked at the import, and can record
  that as a fact about this symbol as well, along with how to
  translate references.

  Also, whether renamed or not, and whether local or imported or even
  externally translated, it may take type arguments.  If so, we need
  to add `<>` if we're not passing any.  Again this is a fact about
  the symbol.

  In short, at mapper time we can look purely at declarations
  (including imports), not references, to build a map on symbols that
  covers this case.


* If it's a qualified name starting with a namespace (other than a
  whole real module), then the namespace is declared in this module
  (possibly by an import); or, again, as a global ambient.  The type
  itself, and for that matter any other namespaces in the chain, may
  be declared somewhere else entirely.

  We will definitely need to rewrite the reference.

  * If the type's declaration is itself local (or global ambient and
    translated by TsFlower), then we'll have renamed it -- from
    `namespace N { type T = … }` to like `type N_T = …` -- and that
    renamed definition will be just as directly accessible.  So we
    just replace the whole qualified name with the new name.

  * If the declaration is via an import somewhere... Hmm, can this
    only mean the namespace at the root of this qualified name is
    imported?  Yes, I think it does:

    * TS gives "Export declarations are not permitted in a namespace."
      if you try `namespace N { export * from 'react' }`.

    * So yeah, without those, I think the only way to put a namespace
      in (the exports of!) a namespace is to have an actual namespace
      declaration there (with an `export` modifier).  And the only way
      to put a type there is to have a type-making declaration (see
      `./ts.md` for what those can be) -- one with an `export`
      modifier, so not an import.

    So, there's some import by which we got that namespace that's at
    the start of the qualified name.

    Moreover, I *think* that by applying the same reasoning to
    wherever we got that root namespace from, we can conclude the type
    has a declaration there.  (Possibly an import, but an import of
    the type and not of some namespace above it.)

    So if the import is from a file we'll be translating, then we have
    a rename for the type.  We just need to emit an import for *that*
    name, with the same module specifier as the original import.

    And if it's from a file with external translation, we'll need to
    apply that translation.


* If it's a qualified name starting with a namespace that we imported
  as a whole real module, then...

  * Hmm, is it possible that the next-level namespace was imported
    there from some other file?  And the next from some other file,
    etc.  In that case, we'll need to either (a) add an import from
    the ultimate type declaration's module, or (b) in translating the
    intermediate modules, explicitly name all the types found in the
    namespaces they re-export.

    TODO determine if that's possible.


# Type position, value position, hybrid type/value position

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

    * Possibly other libraries; for example:

      * Node is described both in `@types/node` and in flowlib.

      * Immutable is written in untyped JS but has first-party type
        definitions for both TS and Flow.  Maintained together, so one
        can hope for some coherence; but still an automatic
        translation of one is not going to be the same as the other.
        The user probably wants the real first-party Flow definitions.

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

These can be gnarlier.  Focusing on class-extends:

* They don't have to be a mere dotted name.  Here's an example which
  both TS and Flow accept:

      export class C<T> { x: T[] = [] }
      export const N = { C }
      export const M = { N }
      export class D1 extends C<number> {}
      export class D2 extends N.C<number> {}
      export class D3 extends N['C']<number> {}
      export class D4 extends { ...M }['N'].C<number> {}

  So it seems the class-extends `.expression` can truly be a property
  access on an arbitrary expression.  (On a LeftHandSideExpression,
  anyway; but that's a merely syntactic restriction, as it can be
  parens around an arbitrary expression.)

* However, in at least a generated .d.ts file, it seems they are.
  Here's what TS generates (reformatted slightly) for a .d.ts from
  that previous example:

      export declare class C<T> { x: T[]; }
      export declare const N: { C: typeof C; };
      export declare const M: { N: { C: typeof C; }; };
      export declare class D1 extends C<number> {}
      export declare class D2 extends N.C<number> {}

      declare const D3_base: typeof C;
      export declare class D3 extends D3_base<number> {}

      declare const D4_base: typeof C;
      export declare class D4 extends D4_base<number> {}

  So it seems like it ensures the expression is just a dotted name
  after all, an EntityNameExpression.  If it wasn't already, then it
  makes up a name for it and just says what the type is.

  * TODO determine if TS also requires that when consuming a .d.ts
    file, so that it also applies to hand-written definitions.

* As that example also illustrates, when it is a dotted name, the
  non-last elements can be ordinary values, not just modules and
  namespaces.  After all, the class is a value.

  And yet the type has to ride along with it -- complete with the
  meaning and constraints assigned to its type parameters.  For
  example, the type could ultimately be `React.Component`, whose type
  arguments we have to rewrite as mentioned above.  Example:

      export class CC1 extends React.Component {}
      export class CC2 extends (await import('react')).Component {}
      export const NN = { O: { P: React['Component'] } }
      export class CC3 extends NN.O.P {}

  And generated .d.ts:

      export declare class CC1 extends React.Component {}
      declare const CC2_base: typeof React.Component;
      export declare class CC2 extends CC2_base {}
      export declare const NN: { O: { P: typeof React.Component; }; };
      export declare class CC3 extends NN.O.P {}


I think perhaps the right strategy for class-extends, given that last
point, is that we should just ask TS directly what the *type* of the
expression is.

* Could be some class, and then we look at its declaration.

* Could be `typeof …`, as in the last example.  Then I guess we
  recurse on the `typeof` argument.  (And I guess it could probably be
  an ImportTypeNode, as well as a TypeQueryNode.)

* Could be, hmm, some ConstructorType, or type literal with a
  ConstructSignature:

      declare const Df2_base: { new <T = string>(): Cf<T>; ss: 3 };
      export declare class Df2 extends Df2_base {}

  I guess I'm not sure there's a Flow equivalent of those in the first
  place.

  If there is, then to handle those, we'll need to go look at that
  construct-signature to see if it has any type parameters, so
  convertTypeArguments can do its job to turn `extends foo` into
  `extends foo<>`.

* Maybe could be other things?  But probably "some class" is like 90%,
  and that plus `typeof Some.Class` is like 99%, in the wild.
