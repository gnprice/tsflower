# TsFlow

Convert TypeScript to Flow.

Currently TsFlow aims only to support `.d.ts` TypeScript type definition
files.  The goal is for a Flow codebase to be able to consume libraries
written in TypeScript, or that have good TS type definitions, without having
to manually write any Flow type definitions for them.


## TODO

- Convert a bunch more kinds of nodes.  There's a fair amount of this,
  but it's mostly straightforward.  The main value of it at an early
  stage is in order to get through a wider swath of real-world TS type
  definitions, in order to have a sample for encountering the other
  challenges.

- Figure out that issue where a function type on an object property, class
  member, or function return value (and perhaps more things) prints with an
  excess colon.  Seems like a `recast` bug, as it's generating syntax that
  doesn't parse. ... Specifically, it looks like a version of this
  patched-over bug: https://github.com/benjamn/recast/pull/688

  That code looks pretty janky; probably it has a number of holes and needs
  a deeper fix.

  This is mainly useful for the same reason as converting more nodes:
  without it, a lot of real-world type definitions don't get started.

- Do more renaming and rewriting:

  - Type references to things like `ReadonlyArray` in the default lib, which
    become a constant other identifier.  Use `defaultLibraryRewrites` with
    `MapResultType.FixedName` in the mapper.

  - Type references to things like `Omit` in the default lib, which have to
    act more like a macro -- rewriting the type reference in place, using
    its arguments.  Use `defaultLibraryRewrites` with
    `MapResultType.TypeReferenceMacro` in the mapper.

- Extend the driver and CLI layer:

  - Output to files, rather than stdout.

  - Transform a program of multiple files at once.

  - Take just an (installed) NPM package name; find the TS type definitions
    via its package.json, find the desired destination via convention and/or
    configuration, and go.

- Build more of a test framework:

  - Have a test script (vs. just having `node . t/sample/downstream.d.ts` in
    interactive shell history.)

  - For the sample files, keep expected output in version control.  Update
    and show diff, if any.

  - Run Flow on sample-file output, and fail on error.

  - Have React and React Native available to import from sample files.  Pull
    in as dev dependencies, then?

  - Act on some packages in integration directory, much the same as on
    sample files.  ... Maybe don't keep expected output in version control;
    seems big.  ... OTOH it does sound awfully nice to make a change and see
    exactly what it does to the output on a wide sample.  ... Hmm, I think I
    basically want to see those diffs in the development-iteration loop, but
    don't want to read them in the history.  Well, start by leaving out and
    just asking if Flow passes.

- Figure out more renaming and rewriting:

  - A possible intermediate category between `MapResultType.FixedName` and
    `MapResultType.TypeReferenceMacro` is that some things could be defined
    as a single (generic) type alias in the Flow type system, but just don't
    happen to be defined in the Flow stdlib.  For those, we may insert a
    definition at the top of the file.

  - Type references to things like `React.Component`, in libraries like
    `react` and `react-native`, which have established Flow definitions but
    divergent TS definitions that some third-party libraries refer to.

    Here we want to translate those reverse-dependency libraries so that the
    result works on top of the established Flow versions of the underlying
    library.  That means we'll rewrite references to those symbols:

    - When the underlying module is imported as a whole, qualified names
      referring to it will get rewritten, using the same import where
      possible.

    - When the underlying module is imported as individual properties, we'll
      adjust the import.  Perhaps keep the original local name -- that will
      avoid the need to deal with name collisions.

    Some of these just need a different name in the same module.  Others
    (like `ReactNative.ViewProps`) correspond to something in a different
    module within the library, or require some macro-like rewriting (like
    the default lib's `Omit`.)

    When a different module is required, we'll need to insert an `import`
    statement.

  - Type references to enum members, which need a `typeof`.

  - Type references to enums themselves, which need a `$Values<typeof …>`.

  - Type declarations that collide with values.  I.e., symbols that have
    both a type and a value declaration.  These need the type renamed at the
    declaration, and references need to follow.

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
