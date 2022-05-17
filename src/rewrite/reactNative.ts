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

const substituteComponentPropTypes = Object.fromEntries(
  ['View'].map((componentName) => [
    `${componentName}Props`,
    mkSubstituteType(`${prefix}${componentName}Props`, () => {
      // Note we don't translate these to refer directly to the
      // corresponding export from RN.  Those are exact object types,
      // whereas the ones in `@types/react-native` (like all TS object
      // types) are inexact.  And RN-using TS code often relies on that, by
      // making intersections as a way of adding more properties.
      const text = `
      import { type ${componentName}Props as ${prefix}${componentName}PropsExact }
        from 'react-native/Libraries/Components/${componentName}/${componentName}PropTypes';
      type ${prefix}${componentName}Props = { ...${prefix}${componentName}PropsExact, ... };
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
    ...substituteComponentPropTypes,
  });
}
