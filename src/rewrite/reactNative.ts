import {
  mkNamespaceRewrite,
  prepSubstituteType,
  NamespaceRewrite,
} from './core';

const prefix = '$tsflower_subst$RN$';

const substituteStyleSheetExports = Object.fromEntries(
  ['ColorValue', 'ViewStyle', 'TextStyle', 'ImageStyle'].map((tsName) => [
    tsName,
    prepSubstituteType(
      // TODO: It'd be nice to reuse the normal names, when there's no conflict.
      prefix + tsName,
      (name) => `
      import { type ${tsName} as ${name} }
        from 'react-native/Libraries/StyleSheet/StyleSheet';
      `,
    ),
  ]),
);

const substituteEventTypes = Object.fromEntries(
  [
    // TODO: add the rest of the event types defined in `@types/react-native`
    //   (this is just what came up in one version of the integration suite)
    ['GestureResponderEvent', 'PressEvent'],
    ['LayoutChangeEvent', 'LayoutEvent'],
    ['NativeSyntheticEvent', 'SyntheticEvent'],
  ].map(([tsName, propertyName]) => [
    tsName,
    prepSubstituteType(
      `${prefix}${tsName}`,
      (name) => `
      import { type ${propertyName} as ${name} }
        from 'react-native/Libraries/Types/CoreEventTypes';
      `,
    ),
  ]),
);

// TODO: apply substitutions atop import types (`import(…).Foo`), too
const substituteComponentPropTypes = Object.fromEntries(
  [
    // TODO: add the whole list of RN components (this is just what came up
    //   in one version of the integration suite)
    'DrawerLayoutAndroid',
    'FlatList',
    'Pressable',
    'ScrollView',
    'Switch',
    'TextInput',
    'Text',
    'TouchableHighlight',
    'TouchableNativeFeedback',
    'TouchableOpacity',
    'TouchableWithoutFeedback',
    'View',
  ].map((componentName) => [
    `${componentName}Props`,
    prepSubstituteType(
      `${prefix}${componentName}Props`,
      // Note we don't translate these to refer directly to the actual props
      // type from RN.  Those are exact object types, whereas the ones in
      // `@types/react-native` (like all TS object types) are inexact.  And
      // RN-using TS code often relies on that, by making intersections as a
      // way of adding more properties.
      // TODO(substitute): Give the auxiliary name here its own substitution.
      (name) => `
      import { typeof ${componentName} as ${prefix}${componentName} }
        from 'react-native';
      type ${name} = { ...React$ElementConfig<${prefix}${componentName}>, ... };
      `,
    ),
  ]),
);

/**
 * Prepare our static rewrite plans for the 'react-native' module.
 */
export function prepReactNativeRewrites(): NamespaceRewrite {
  return mkNamespaceRewrite({
    StyleProp: prepSubstituteType(
      `${prefix}StyleProp`,
      // Actual RN doesn't export this, but see definition in
      // react-native/Libraries/StyleSheet/StyleSheetTypes.js
      // of GenericStyleProp.
      (name) => `
      type ${name}<+T> = null | void | T | false | '' | $ReadOnlyArray<${name}<T>>;
      `,
    ),
    ...substituteStyleSheetExports,
    ...substituteEventTypes,
    ...substituteComponentPropTypes,
    StatusBarAnimation: prepSubstituteType(
      `${prefix}StatusBarAnimation`,
      (name) => `
      import { type StatusBarAnimation as ${name} }
        from 'react-native/Libraries/Components/StatusBar/StatusBar';
      `,
    ),
  });
}
