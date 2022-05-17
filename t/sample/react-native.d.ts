import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ColorValue,
  ViewProps,
  GestureResponderEvent,
} from 'react-native';
import RN from 'react-native';

// TODO(test): Add Flow test code to confirm this all interoperates properly
//   with RN

declare var style: {
  normal: StyleProp<ViewStyle>;
  viaDefault: RN.StyleProp<RN.ViewStyle>;
  text: StyleProp<TextStyle>;
  image: StyleProp<ImageStyle>;
};

declare var color: ColorValue;

declare var events: {
  gesture: GestureResponderEvent;
  layoutChange: RN.LayoutChangeEvent;
  nativeSynthetic: RN.NativeSyntheticEvent<{ x: number }>;
};

declare var props: {
  drawerLayoutAndroidProps: RN.DrawerLayoutAndroidProps;
  flatListProps: RN.FlatListProps;
  pressableProps: RN.PressableProps;
  scrollViewProps: RN.ScrollViewProps;
  switchProps: RN.SwitchProps;
  textInputProps: RN.TextInputProps;
  textProps: RN.TextProps;
  touchableHighlightProps: RN.TouchableHighlightProps;
  touchableNativeFeedbackProps: RN.TouchableNativeFeedbackProps;
  touchableOpacityProps: RN.TouchableOpacityProps;
  touchableWithoutFeedbackProps: RN.TouchableWithoutFeedbackProps;
  viewProps: ViewProps;

  viewPropsPlus: ViewProps & { foo: string };
};
