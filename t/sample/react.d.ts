import React, { Component, Component as Component2 } from "react";
import * as React2 from "react";

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
