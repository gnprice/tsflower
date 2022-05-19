import {
  mkNamespaceRewrite,
  NamespaceRewrite,
  prepImportSubstitute,
} from './core';

const prefix = '$tsflower_subst$RN$';

/**
 * Prepare our static rewrite plans for the 'react-native' module.
 */
export function prepReactNativeRewrites(): NamespaceRewrite {
  return mkNamespaceRewrite(
    // TODO: Have the mapper find these import substitutions directly from
    //   the declarations in subst/, rather than list them here
    Object.fromEntries(
      [
        'StyleProp',

        'ColorValue',
        'ViewStyle',
        'TextStyle',
        'ImageStyle',

        'GestureResponderEvent',
        'LayoutChangeEvent',
        'NativeSyntheticEvent',

        'DrawerLayoutAndroidProps',
        'FlatListProps',
        'PressableProps',
        'ScrollViewProps',
        'SwitchProps',
        'TextInputProps',
        'TextProps',
        'TouchableHighlightProps',
        'TouchableNativeFeedbackProps',
        'TouchableOpacityProps',
        'TouchableWithoutFeedbackProps',
        'ViewProps',

        'StatusBarAnimation',
      ].map((name) => [
        name,
        prepImportSubstitute(
          name,
          prefix + name,
          'tsflower/subst/react-native',
        ),
      ]),
    ),
    {
      Animated: mkNamespaceRewrite(
        Object.fromEntries(
          ['AnimatedAddition', 'AnimatedInterpolation'].map((name) => [
            name,
            prepImportSubstitute(
              name,
              prefix + 'Animated$' + name,
              'tsflower/subst/react-native',
            ),
          ]),
        ),
      ),
    },
  );
}
