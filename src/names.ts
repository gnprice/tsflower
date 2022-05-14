/**
 * Make a deterministic, unique, JS-valid identifier based on the given strings.
 *
 * The result is a string which begins with `prefix` and can be used as a
 * JavaScript identifier name.  It's always the same when called with the
 * same arguments, and always different when called with different
 * arguments.
 *
 * The argument `prefix` is required to be a valid JS identifier name.
 */
export function escapeNamesAsIdentifierWithPrefix(
  prefix: string,
  ...names: string[]
): string {
  // The set of valid JS identifier names is defined here:
  //   https://tc39.es/ecma262/#prod-IdentifierName
  // In particular, after the first character, each character can be `$`
  // or any character with the `ID_Continue` Unicode property, among others.

  // For our construction, first, we produce a list of strings where all
  // characters have `ID_Continue`, as an invertible function of `names`,
  // and none of them is simply `_`.
  const escapedNamesList = names.map(escapeAsIdContinue);

  // Then we delimit the escaped names with `$`, which lacks `ID_Continue`
  // and therefore cannot appear in the escaped names…
  const escapedNamesString = escapedNamesList.join('$');

  // … and we delimit the prefix from that with `$_$`, which cannot appear
  // in the combined escaped-names string because no escaped name is `_`.
  return prefix + '$_$' + escapedNamesString;
}

/**
 * A string of all ID_Continue, as a deterministic, invertible function.
 *
 * That is, each character in the result has the `ID_Continue` Unicode
 * property; and the result is always the same when called with the same
 * argument, and always different when called with different arguments.
 *
 * Moreover, the result is never the string `_`, a single underscore.
 */
function escapeAsIdContinue(name: string): string {
  // For our construction:
  //  * Characters in `name` with `ID_Continue`, other than `_`, we use
  //    verbatim.
  //  * Other characters we replace with an escape sequence, marked by `_`.
  // This provides a string where all characters have `ID_Continue`, as an
  // invertible function of `name`.
  const escapedName = name.replace(
    /\P{ID_Continue}|_/gu,
    (c) => `_${c.codePointAt(0)!.toString(16)}_`,
  );

  // This escaping always gives different results for different inputs,
  // because the following code would reconstruct the input:
  //   assert(
  //     name ===
  //       escapedName.replace(/_[^_]*_/g, s =>
  //         String.fromCodePoint(Number.parseInt(s.substring(1), 16)),
  //       ),
  //   );

  // And the result is never simply `_`, because we replace all underscores
  // in the output, and we introduce them always in pairs.

  return escapedName;
}
