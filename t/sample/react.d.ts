import React, {
  Component,
  Component as Component2,
  //  ReactElement // TODO rewrite imports, too
} from 'react';
import * as React2 from 'react';

// `React.Component` in Flow requires its first argument.
// Test that we rewrite references that lack that.
// First in TypeReference form…
var reactComponent: {
  a: Component;
  b: React.Component;
  b: React2.Component;
};

// … then as the base of a class.
// (This one uses its own import, to test that the mapper sees it
// and we're not free-riding on the mapper seeing a TypeReference
// of the same symbol.)
declare class ReactComponentTest extends Component2 {}
declare class ReactComponentTest extends React.Component {}
declare class ReactComponentTest extends React2.Component {}

type AProps = { x: number; y: string };
declare class A extends Component<AProps> {}
declare class AA extends React.Component<AProps> {}
declare class AAA extends React2.Component<AProps> {}

// `React.ReactElement` corresponds to `React.Element` in Flow,
// and with different type arguments.
var reactElement: {
  // a1: ReactElement;
  a2: React.ReactElement;
  a3: React2.ReactElement;
  // b1: ReactElement<AProps>;
  b2: React.ReactElement<AProps>;
  b3: React2.ReactElement<AProps>;
  // c1: ReactElement<AProps, "div">;
  c2: React.ReactElement<AProps, 'div'>;
  c3: React2.ReactElement<AProps, 'div'>;
};

var reactNode: React.ReactNode;

var ref: {
  refObject: React.RefObject<number>;

  // TODO(test): Add Flow test code to confirm this interoperates with flowlib
  ref: React.Ref<number>;
  ref2: React.Ref<React.Component<>>;

  // TODO(test): Add Flow test code to confirm this interoperates with flowlib
  // TODO(test): Test RefAttributes in separate file from Ref, to exercise
  //   dependencies
  refAttributes: React.RefAttributes<React.Component<>>;

  // TODO(test): Add Flow test code to confirm this interoperates with flowlib
  forwardRefExoticComponent: React.ForwardRefExoticComponent<
    { x: string } & React.RefAttributes<React.Component<>>
  >;
};

var jsx: {
  element: JSX.Element;
};
