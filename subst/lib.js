/**
 * Stub empty file to go alongside its `.js.flow` counterpart.
 *
 * Without this, on importing from e.g. `"tsflower/subst/react"`,
 * Flow gives a cannot-resolve-module error.  That's even though it does
 * actually find the `.js.flow` file: if you introduce an error there,
 * Flow reports that error as well as the cannot-resolve-module.
 * Shrug.  This workaround is pretty mild.
 *
 * @flow
 */
