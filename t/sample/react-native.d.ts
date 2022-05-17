import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ColorValue,
  ViewProps,
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

declare var props: {
  viewProps: ViewProps;
  // TODO: This is a typical idiom in RN-using TS code... but our
  //   translation actually won't work as intended, because the ViewProps
  //   type in actual RN is exact.
  viewPropsPlus: ViewProps & { foo: string };
};
