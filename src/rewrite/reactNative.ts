// @ts-expect-error no TS types for flow-parser :-p
import * as flowParser from 'flow-parser';
import * as recast from 'recast';
import { mkNamespaceRewrite, mkSubstituteType, NamespaceRewrite } from './core';

const prefix = '$tsflower_subst$RN$';

const substituteStyleSheetExports = Object.fromEntries(
  ['ColorValue', 'ViewStyle', 'TextStyle', 'ImageStyle'].map((name) => [
    name,
    mkSubstituteType(prefix + name, () => {
      // TODO: It'd be nice to reuse the normal names, when there's no conflict.
      const text = `
      import { type ${name} as ${prefix}${name} }
        from 'react-native/Libraries/StyleSheet/StyleSheet';
    `;
      return recast.parse(text, { parser: flowParser }).program.body;
    }),
  ]),
);

/**
 * Prepare our static rewrite plans for the 'react-native' module.
 */
export function prepReactNativeRewrites(): NamespaceRewrite {
  return mkNamespaceRewrite({
    StyleProp: mkSubstituteType('$tsflower_subst$RN$StyleProp', () => {
      // Actual RN doesn't export this, but see definition in
      // react-native/Libraries/StyleSheet/StyleSheetTypes.js
      // of GenericStyleProp.
      const name = '$tsflower_subst$RN$StyleProp';
      const text = `
      type ${name}<+T> = null | void | T | false | '' | $ReadOnlyArray<${name}<T>>;
      `;
      return recast.parse(text, { parser: flowParser }).program.body;
    }),
    ...substituteStyleSheetExports,
  });
}
