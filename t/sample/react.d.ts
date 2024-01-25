import {
  Component,
  Component as Component2,
  //  ReactElement // TODO rewrite imports, too
} from 'react';
import React2 from 'react'; // TODO make this fully work too; see comment at convertTypeArguments
import * as React from 'react';

//
// Keep this file in the same order as subst/react.js.flow
// (which in turn is the same order as `@types/react/index.d.ts`.)
//

var jsxElementConstructor: React.JSXElementConstructor<{ x: number }>;

var refObject: React.RefObject<number>;

var refCallback: React.RefCallback<number>;

// TODO(test): Add Flow test code to confirm this interoperates with flowlib
var ref: React.Ref<number>;
var ref2: React.Ref<React.Component<>>;

var legacyRef: React.LegacyRef<boolean>;

var componentState: React.ComponentState;

// TODO(test): Add Flow test code to confirm this interoperates with flowlib
var refAttributes: React.RefAttributes<React.Component<>>;

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

var cElement1: React.CElement<{ x: number }>;
var cElement2: React.CElement<{ x: number; y: string; z: boolean }, A>;

var componentElement1: React.ComponentElement<{ x: number }>;
var componentElement2: React.ComponentElement<
  { x: number; y: string; z: boolean },
  A
>;

var reactNode: React.ReactNode;

var context1: {
  providerProps: React.ProviderProps<string>;
  consumerProps: React.ConsumerProps<string>;
};

var namedExoticComponent: React.NamedExoticComponent<{}>;

var context2: {
  provider: React.Provider<string>;
  consumer: React.Consumer<string>;
  context: React.Context<string>;
};

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

var functionComponent0: React.FunctionComponent;
var functionComponent1: React.FunctionComponent<{ x: number }>;

// TODO(test): Add Flow test code to confirm this interoperates with flowlib
var forwardRefExoticComponent: React.ForwardRefExoticComponent<
  { x: string } & React.RefAttributes<React.Component<>>
>;

var propsWithoutRef1: React.PropsWithoutRef<{ x: number; ref: string }>;
var propsWithoutRef2: React.PropsWithoutRef<{ x: number }>;
var propsWithoutRef3: React.PropsWithoutRef<
  { x: number; ref: string } | { y: number }
>;

var propsWithChildren: React.PropsWithChildren<{ x: number }>;

var componentProps: {
  // TODO(test): Add Flow test code to confirm this interoperates
  a: React.ComponentProps<A>;
};

// TODO(test): Add Flow test code to check this against React.memo etc.
var memoExoticComponent: React.MemoExoticComponent<A>;

var mutableRefObject: React.MutableRefObject<number>;

var event: {
  mouseEvent: React.MouseEvent;
};

// The namespace `React.JSX` exists in `@types/react/index.d.ts`
// at version 17.0.75, though it's gone as of version 18.0.9.
var reactJsx: {
  element: React.JSX.Element;
};

var jsx: {
  element: JSX.Element;
};
