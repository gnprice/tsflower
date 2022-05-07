## `t/imported/`

These files are meant to be imported from the test files in `t/sample/`.

Unlike the files in `t/sample/`, TsFlower itself doesn't get run on these
`.d.ts` files; instead, the corresponding `.js.flow` files are hand-written
separately.  This is useful for simulating situations that are found in
places like the TS default library or the TS type definitions for React or
React Native.

This directory is located outside of `t/sample/` just so that a plain
`tsflower tree` command on `t/sample/` excludes it.
