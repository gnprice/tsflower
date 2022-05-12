Some scratch notes on the TypeScript language and implementation.


# Declarations

Here's a pretty good doc from upstream on how declarations work:
  https://www.typescriptlang.org/docs/handbook/declaration-files/deep-dive.html

I especially appreciate the clear lists at the top of which kinds of
declarations create types, and which create values.  To restate,
here's the complete list:

 * Type alias declarations and interface declarations create types.

 * Variable declarations (`let`, `const`, `var`) and function
   declarations create values.

 * A class declaration or enum declaration creates *both* a type and a
   value.

   * A class declaration creates a type describing its instances, and
     a value for its constructor.

   * An enum declaration… isn't explained in this doc, but it creates
     a value which is an object containing the members' names and
     values, and a type consisting of its members.

 * A namespace declaration (whether spelled `namespace foo` or
   `module foo`) creates a *namespace*, which is a third kind of
   thing.  Namespaces can contain more namespaces, and types.

   If the namespace declaration contains a value, then it also creates
   a value.

 * An import declaration may create a type, a value, a namespace, or
   any combination, corresponding to what it refers to.

   * What if it refers to a module?  (This isn't clearly addressed in
     the doc.)  I guess perhaps the point is that the module itself
     just functions as a value, or a namespace, or both.

     In fact I guess more precisely: the default export may be any
     kind of value, and may also be a namespace.  The namespace export
     will I think always be a value, specifically an object… and I
     guess will probably also always be a namespace, albeit perhaps an
     empty one.


# Consuming JSDoc

A bunch of the node types, and their members, have "JSDoc" or "jsdoc"
in their names.

These refer (or at least some of them do) to the syntax found *in*
JSDoc comments, providing type annotations there.  User docs:
  https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

For example, instead of writing a type alias like this:

    type T = number;

you can write this:

    /** @typedef {number} T */

That produces a `JSDocTypedefTag` node, rather than a
`TypeAliasDeclaration` node.

* Sometimes these get entangled into the non-JSDoc AST types.  For
  example, when JSDoc annotations aren't involved, the body of a
  `ModuleDeclaration` (other than the "external module" form, like
  `module "foo"`) is either a `ModuleBlock` (which is basically a list
  of statements), or another `ModuleDeclaration`.  So parsing the code
  `namespace a.b { type T = number }` produces this (in a pseudocode
  pretty-print):

      ModuleDeclaration(Identifier("a"),
        ModuleDeclaration(Identifier("b"),
          ModuleBlock([
            TypeAliasDeclaration(…),
          ])))

  But then you can also write concrete syntax like this:

      /** @typedef {number} a.b.T */

  and that will get parsed to, if I'm reading this right:

      JSDocTypedefTag(
        fullName = ModuleDeclaration(Identifier("a"),
                     ModuleDeclaration(Identifier("b"),
                       Identifier("T"))),
        name = Identifier("T"),
        typeExpression = JSDocTypeExpression(…),
      )

