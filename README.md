# TsFlower

Convert TypeScript to Flow.

Currently TsFlower aims only to support `.d.ts` TypeScript type definition
files.  The goal is for a Flow codebase to be able to consume libraries
written in TypeScript, or that have good TS type definitions, without having
to manually write any Flow type definitions for them.


## Usage

Quick demo command:
`$ tsflower file some/file.d.ts output/file.js.flow`

For more, see:
`$ tsflower --help`


## TODO

- Get the current integration suite working (so `@react-navigation/*`,
  in addition to `react-native-safe-area-context`.)

  There are 36 Flow errors.  Here's the list of remaining issues, with
  the number of errors they each account for (not to prioritize, but
  to help check that all errors are accounted for).  Several are
  discussed in more detail below.

  - Substitute for RN component types like `View`: `@types` has them
    as classes, but the real things are not, so not usable as types.
    Therefore rewrite type references to get the intended types.
    (2 errors)

  - Convert `import type { someValue }` to `import typeof`; and then
    any references to it in `typeof` (which should be the only
    references to it) to just direct type references.  (8 errors)

  - Drop imports that are of only a namespace (or a namespace and a
    value, if no `import typeof` was needed.)  (2 errors at
    `Animated`; plus the one at `CommonActions` again)

  - Rewrite type references `Foo.Bar` where `Foo` comes from an import
    specifier, `import { Foo, …`.  We'll need to emit a more direct
    import of the type.  (1 error, at `CommonActions`)

  - Substitute for the default lib's `PromiseLike`.  (3 errors)

  - Substitute for the default lib's `Extract`.  (3 errors)

  - Handle `/// <reference types="react" />`.  (6 errors)

  - (Just fudge this for the present:) `react-native-gesture-handler`
    remains untyped.  (8 errors)

  - Errors where "an unknown property that may exist" on one object
    type "is incompatible with" another object type; all in
    `@react-navigation/core/types`.  Might fudge these for the
    present; I'm a bit puzzled that TS accepts these types in the
    first place.  (3 errors)

- Convert more kinds of nodes.  Almost everything found in our
  integration suite (a selection of third-party TS libraries) is
  covered, but some remain.

  - The most interesting remaining cases are perhaps namespace
    declarations and enum declarations, discussed below under
    "renaming and rewriting".

  - There's also some things that it's not clear how to map to Flow:
    for example, TS's conditional types, particularly with their
    "distributive" behavior on unions.

  - Convert [TS function types returning `void`][] to return `mixed`, just
    as if the originals had returned `unknown`.  Pretty sure TS's quirky
    behavior there means that a function type returning `void` is equivalent
    to (mutually assignable to) one returning `unknown`.

[TS function types returning `void`]: https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void

  - Sometimes this requires fixes to Recast and/or `ast-types`, because
    their support for Flow is incomplete.  E.g. Recast PRs #1089 and #1090,
    and `ast-types` PRs #745 and #746.  These are a nice pair of libraries
    with a good design, but it seems like perhaps nobody has been seriously
    using them with Flow code for some time.

    Is there another AST data structure and emitter that we could be using
    that would be better?  In particular, the folks at Facebook/Meta do love
    their codemods, and they're all in on Flow -- so surely whatever tool
    they're using does have solid Flow support.

- Add more substitutions in `subst/*.js.flow`; and where needed, macros in
  `src/rewrite/*.ts`.

  - Cover all the remaining names that come up in the integration suite.

  - Make systematic sweeps through swaths of the libraries the substitutions
    apply to, covering everything around the definitions we've needed so
    far:

    - In `@types/react`, the whole main sections (through the "Component
      API" section, to the definition of LazyExoticComponent)

    - In `@types/react`, all the event types (just re-export them all from
      flowlib's react-dom.js, hopefully)

    - In `@types/react-native`, the swaths commented in the subst file

    - In the TS default library, all the operators akin to `Record` and
      `Omit`... or perhaps for these it's better to wait to see them come up
      in practice, because the translations are likely not to cover all
      possible cases and it's helpful to see what cases actually come up.

- Extend the driver and CLI layer:

  - Track the number of unimplemented and/or error nodes; print counts to
    stderr as warnings.  (Perhaps options to be more or less verbose?  Break
    down by file, or give total across all files; break down by node kind,
    or not; verbosely print actual text (perhaps first N chars of it, in
    case it's a giant module or namespace or class etc.))

  - Take just an (installed) NPM package name; find the TS type definitions
    via its package.json, find the desired destination via convention and/or
    configuration, and go.

    See `integration/run` for a way to make the output resolvable for Flow,
    by adding an `index.js.flow` indirection.

  - Have the subcommand that takes an NPM package name accept a list of
    them, and act on them all as one program, so that rewrites
    propagate appropriately.

  - Have a subcommand -- and make this the default on running simply
    `tsflower` -- that gets a list of packages to act on from a config
    file.

  - Have some automatic inference of what packages to act on: e.g. by
    taking the root `package.json`'s dependencies (and dev-deps? those
    are so often not imported, but sometimes are, e.g. for tests and for
    build scripts), looking for `.types` in those packages'
    `package.json` as a sign they're TS, and recursing.  If that
    inference can be made fast, use it as the default that the config
    file overlays upon; if not, use it for initializing the config
    file in a `tsflower init`.

- More consistently handle errors as nice and structured:

  - See remaining `TODO(error)` comments.

  - In general, always use structured helpers like `errorStatement` and its
    friends; always leave a marker comment in the output.

- Extend the test framework:

  - For `t/sample` tests, include some Flow code to exercise the
    output.  Particularly helpful for rewrites of React and
    react-native references: check that `View` accepts something with
    our translation of `ViewProps`, that a `MemoExoticComponent` can
    be used as a JSX element-type, etc.

  - Give the driver an option (`--interlinear`, for "interlinear
    text"?) to include the original as a comment next to every
    statement, not only when there's an error.  Then use that when
    running on `t/sample/` files, so that the outputs are
    self-contained to read to look for discrepancies.

  - Once the substitution system has a way for user projects to supply
    their own substitutions, take advantage of that in the `t/sample/`
    tests in order to directly exercise aspects of the behavior of
    SubstituteType rewrites.  (For example, that we drop an import if
    it's only of a type that's getting substituted, but keep it if
    it's also of a value.)

  - Have `integration/run` check that Flow accepts the output, once
    we've gotten to the point where it indeed does.

  - Perhaps track changes to output on integration suite, much like
    sample suite.  ... Maybe don't keep expected output in version control;
    seems big.  ... OTOH it does sound awfully nice to make a change and see
    exactly what it does to the output on a wide sample.  ... Hmm, I think I
    basically want to see those diffs in the development-iteration loop, but
    don't want to read them in the history.

- Preserve JSDoc, like `tsc` does when generating `.d.ts` files.

  - Better yet, preserve comments and formatting in general, where possible.
    This might mean parsing with Recast in the first place, which would also
    cut down on some of the boring parts of conversion... but OTOH would
    require working something out for how to get TS type-checker / symbol
    information, since that's naturally only available on TS's own AST.

- Extend the substitution system:

  - Get the list of substitutions for a given library by reading the
    substitution file, rather than having to list them in the rewriter
    source code.

    - For namespaces, perhaps make a separate file corresponding to the
      namespace?  Then the emitted Flow code can effectively import the
      namespace by importing that file.  Will need some sort of convention
      for naming such files, and/or some form of metadata.

    - For global augmentations, perhaps again a separate file with some kind
      of naming convention.  Perhaps also some form of metadata -- perhaps a
      `/// <foo … />` comment akin to TS's reference pragmas, if marking the
      file, or some other form of comment if marking individual declarations.

  - Have a way for a project using TsFlower to provide substitutions, in
    addition to those TsFlower itself provides.

  - Move all our "misc" rewrites -- those for react-navigation and any other
    library that we expect to be actually translating -- to be provided by
    the user project.  (So in the TsFlower repo, move them to the
    integration suite.)

- Figure out more renaming and rewriting:

  - Apply rewrites to import types, like `import('react').Component`, just
    like we do for type references like `React.Component`.

  - When an input file has a reference like `React.Component` where `React`
    is a global -- because it just said `/// <reference types="react" />`
    and didn't actually import React -- apply substitutions there just like
    we would if it'd done the import.  (Not sure the right way to generalize
    this.  Fortunately I think there are not many other things people do
    this with.)

  - When introducing a name (with a `SubstituteType` rewrite), try to
    use the original name, rather than our `$tsflower_subst$`-prefixed
    versions.  This will require identifying when the name would
    collide with something (and then when each candidate like `Foo_1`,
    `Foo_2`, … would collide with something.)  Can we use the
    checker's symbol lookup, rather than attempting to scan the AST
    for declarations ourselves?

  - Type references to enum members, which need a `typeof`.

  - Type references to enums themselves, which need a `$Values<typeof …>`.

  - Type declarations that collide with values.  I.e., symbols that have
    both a type and a value declaration.  These need the type renamed at the
    declaration, and references need to follow.

    A first cut at this is now done.  But it needs refinement:

    - The new name needs to be unique; currently it could itself happen to
      collide with something else.

    - We don't handle `export … from`, and probably need to.

  - Type declarations inside namespaces.  These need to get moved to top
    level with some name, e.g. `$`-separated with the namespace as prefix.
    References need to follow.

  - Merged definitions: one symbol with

    - multiple namespace definitions
    - multiple enum definitions
    - multiple interface definitions
    - mixed namespace and enum definitions
    - likely some other possibilities.

    These need to be merged into one definition.

    What if they span files? Try to get away with not supporting that.


## Developing

This section is about doing development on TsFlower itself.  None of it is
needed when simply using TsFlower.

The test suite uses a handful of shell scripts.  These are formatted with
[`shfmt`][shfmt].  You can install `shfmt` with your system's package
manager, or with `nix-env -iA nixpkgs.shfmt` after installing [Nix][].

[shfmt]: https://github.com/mvdan/sh#shfmt
[Nix]: https://nixos.org/download.html#download-nix
