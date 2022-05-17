import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ColorValue,
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
