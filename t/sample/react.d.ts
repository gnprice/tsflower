import React, { Component, Component as Component2 } from "react";

// `React.Component` in Flow requires its first argument.
// Test that we rewrite references that lack that.
// First in TypeReference form…
var reactComponent: {
  a: Component;
  // b: React.Component; // TODO perform rewrite in this context
};

// … then as the base of a class.
// (This one uses its own import, to test that the mapper sees it
// and we're not free-riding on the mapper seeing a TypeReference
// of the same symbol.)
declare class ReactComponentTest extends Component2 {}

type AProps = { x: number; y: string };
declare class A extends Component<AProps> {}
declare class AA extends React.Component<AProps> {}
