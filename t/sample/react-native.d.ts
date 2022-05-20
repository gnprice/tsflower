import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ColorValue,
  ViewProps,
  GestureResponderEvent,
  Animated,
  View,
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

// The types for instances of (or refs for) various components.
declare var componentInstanceTypes: {
  drawerLayoutAndroid: RN.DrawerLayoutAndroid;
  flatList: RN.FlatList;
  pressable: RN.Pressable;
  scrollView: RN.ScrollView;
  switch: RN.Switch;
  textInput: RN.TextInput;
  text: RN.Text;
  touchableHighlight: RN.TouchableHighlight;
  touchableNativeFeedback: RN.TouchableNativeFeedback;
  touchableOpacity: RN.TouchableOpacity;
  touchableWithoutFeedback: RN.TouchableWithoutFeedback;
  view: View;
};

// The types for props for various components.
declare var componentProps: {
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

// Types related to particular components, other than the instance and
// props types above.
declare var componentMisc: {
  statusBar: {
    animation: RN.StatusBarAnimation;
  };
};

declare var animated: {
  addition: Animated.AnimatedAddition;
  interpolation: Animated.AnimatedInterpolation;
  withAnimatedValue: Animated.WithAnimatedValue;

  addition2: RN.Animated.AnimatedAddition;
};
