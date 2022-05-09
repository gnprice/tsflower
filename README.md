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

- Convert a bunch more kinds of nodes.  There's a fair amount of this,
  but it's mostly straightforward.  The main value of it at an early
  stage is in order to get through a wider swath of real-world TS type
  definitions, in order to have a sample for encountering the other
  challenges.

  - Sometimes this requires fixes to Recast and/or `ast-types`, because
    their support for Flow is incomplete.  E.g. Recast PRs #1089 and #1090,
    and `ast-types` PRs #745 and #746.  These are a nice pair of libraries
    with a good design, but it seems like perhaps nobody has been seriously
    using them with Flow code for some time.

    Is there another AST data structure and emitter that we could be using
    that would be better?  In particular, the folks at Facebook/Meta do love
    their codemods, and they're all in on Flow -- so surely whatever tool
    they're using does have solid Flow support.

- Do more renaming and rewriting:

  - Type references to things like `ReadonlyArray` in the default lib, which
    become a constant other identifier.  Use `defaultLibraryRewrites` with
    `'FixedName'` in the mapper.

  - Type references to things like `Omit` in the default lib, which have to
    act more like a macro -- rewriting the type reference in place, using
    its arguments.  Use `defaultLibraryRewrites` with `'TypeReferenceMacro'`
    in the mapper.

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

- More consistently handle errors as nice and structured:

  - See remaining `TODO(error)` comments, and remaining `throw` statements.
    (Some of the latter are doing something structured, but some aren't.)

  - In general, always use structured helpers like `errorStatement` and its
    friends; always leave a marker comment in the output.

- Extend the test framework:

  - Have React Native available to import from sample files, too (like we do
    React.)

  - Give the driver an option (`--interlinear`, for "interlinear text"?) to
    include the original as a comment next to every statement, not only when
    there's an error.  Then use that when running on sample files, so that
    they're self-contained to read to look for discrepancies.

  - Act on some packages in integration directory, much the same as on
    sample files.  ... Maybe don't keep expected output in version control;
    seems big.  ... OTOH it does sound awfully nice to make a change and see
    exactly what it does to the output on a wide sample.  ... Hmm, I think I
    basically want to see those diffs in the development-iteration loop, but
    don't want to read them in the history.  Well, start by leaving out and
    just asking if Flow passes.

    See `integration/run` for a start on this.

- Preserve JSDoc, like `tsc` does when generating `.d.ts` files.

  - Better yet, preserve comments and formatting in general, where possible.
    This might mean parsing with Recast in the first place, which would also
    cut down on some of the boring parts of conversion... but OTOH would
    require working something out for how to get TS type-checker / symbol
    information, since that's naturally only available on TS's own AST.

- Figure out more renaming and rewriting:

  - A possible intermediate category between `'FixedName'` and
    `'TypeReferenceMacro'` is that some things could be defined
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
