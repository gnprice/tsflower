import React, { Component } from "react";

type AProps = { x: number; y: string };
declare class A extends Component<AProps> {}
// declare class AA extends React.Component<AProps> {} // TODO qualified name in `extends`
