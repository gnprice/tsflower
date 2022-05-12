Some scratch notes on the TypeScript language and implementation.


# Declarations

## Upstream doc for .d.ts authors

Here's a pretty good doc from upstream on how declarations work:
  https://www.typescriptlang.org/docs/handbook/declaration-files/deep-dive.html

I especially appreciate the clear lists at the top of which kinds of
declarations create types, and which create values.  To restate,
here's the complete list:

(… But the real list is longer; see next section.  I think this can be
salvaged, though, by calling it the list of declaration *statements*
that create each kind.)

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

   * Hmm, actually it appears that an enum declaration creates all
     three kinds of bindings: `SymbolFlags.Namespace` includes `Enum`.
     And yep, this demonstrates it: `enum E { A }; const a: E.A = 0;`.

 * A namespace declaration (whether spelled `namespace foo` or
   `module foo`) creates a *namespace*, which is a third kind of
   thing.  Namespaces can contain more namespaces, and types.

   If the namespace declaration contains a value, then it also creates
   a value.

   (Empirically: it creates a value if it has any statement TS would
   emit in JS.  Even an empty `;` or `{}` suffices.  But type alias
   declarations and interface declarations don't; nor import-equals.
   Which I think is the only kind of import allowed in a namespace?)

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


## SymbolFlags

The `SymbolFlags` enum appears to classify kinds of declarations.  It
describes which ones create types, values, or namespaces; and which
ones can and can't coexist with which.

It looks like each kind of declaration is a different bit-flag; and a
symbol will have the union of the flags for the different declarations
it has.  (There are a few other bit-flags, like
`SymbolFlags.Optional`.)


Then:
 * `Symbol.Value` is the declaration kinds that create values.
 * `Symbol.Type` is those that create types.
 * `Symbol.Namespace` is those that create namespaces.

These look like (edited slightly from TS v4.7-rc):

    Value = Variable | Property | EnumMember | ObjectLiteral | Function | Class | Enum | ValueModule | Method | Accessor,
    Type = Class | Interface | Enum | EnumMember | TypeLiteral | TypeParameter | TypeAlias,
    Namespace = ValueModule | NamespaceModule | Enum,

Note there's a bunch more there that aren't in the list above:

 * Enum is a namespace as well as type and value (added this above.)
 * EnumMember is a type and value.
 * Property, Method, and Accessor are values.
 * TypeLiteral is a type.
 * ObjectLiteral is a value.
 * TypeParameter is a type.


Then there are `FooExcludes` members of the enum.  In general
`FooExcludes` says what kinds of declarations can't coexist with
`Foo`.  These are (lightly edited from TS v4.7-rc):

    FunctionScopedVariableExcludes = Value & ~FunctionScopedVariable,
    BlockScopedVariableExcludes = Value,
    ParameterExcludes = Value,
    PropertyExcludes = None,
    EnumMemberExcludes = Value | Type,
    FunctionExcludes = Value & ~(Function | ValueModule | Class),
    ClassExcludes = (Value | Type) & ~(ValueModule | Interface | Function), // class-interface mergability done in checker.ts
    InterfaceExcludes = Type & ~(Interface | Class),
    RegularEnumExcludes = (Value | Type) & ~(RegularEnum | ValueModule), // regular enums merge only with regular enums and modules
    ConstEnumExcludes = (Value | Type) & ~ConstEnum, // const enums merge only with const enums
    ValueModuleExcludes = Value & ~(Function | Class | RegularEnum | ValueModule),
    NamespaceModuleExcludes = 0,
    MethodExcludes = Value & ~Method,
    GetAccessorExcludes = Value & ~SetAccessor,
    SetAccessorExcludes = Value & ~GetAccessor,
    TypeParameterExcludes = Type & ~TypeParameter,
    TypeAliasExcludes = Type,
    AliasExcludes = Alias,

These are given meaning in two places:

 * The binder is full of calls to `declareSymbolAndAddToSymbolTable`,
   the bulk of which look like:

       declareSymbolAndAddToSymbolTable(node, SymbolFlags.Foo, SymbolFlags.FooExcludes)

 * The checker has a `getExcludedSymbolFlags`, with a bunch of lines
   like:

       if (flags & SymbolFlags.Class) result |= SymbolFlags.ClassExcludes;

   This has two call sites; I think the main one is:

       function mergeSymbol(target: Symbol, source: Symbol, unidirectional = false): Symbol {
           if (!(target.flags & getExcludedSymbolFlags(source.flags)) ||

   where the `else` means there's an error.  So that seems like it's
   doing a pretty *similar* job to what the binder is doing.

   I think probably the checker's `mergeSymbol` handles merging
   declarations across files, and perhaps across separate `namespace`
   etc. declarations in one file.


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

