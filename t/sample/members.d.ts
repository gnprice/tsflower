/** Testing members of classes, interfaces, and type literals / object types. */

export declare var value: {
  property: string;
  readonly propertyRo: string;

  get getter(): number;
  set setter(value: number);

  method1(): void;
  method2(x: number): string;
  functionProperty: (x: number) => string;

  destructuringMethod({ x }: { x: number }): void;

  "property keyed by StringLiteral": string;
  "method StringLiteral"(): void;
  "": number;
  // hmm, Flow rejects with "Get/set properties not yet supported.":
  // get "getter StringLiteral"(): string;

  1: string;
  020: string;
  0o020: string;
  0x1a: string;
  1e2: string;
  1.2e3: string;
};

export declare class C {
  constructor(); // TODO: should return void, not any

  f(cb: (s: string) => void): void;
  g(other: this): this;
  // 'import'(cb: (s: string) => void): this;  // TS supports this, but Flow has no equivalent.

  readonly propertyRo: string;

  get getter(): number;
  set setter(value: number);

  x;
  y: this;
  z?;
  w?: number;
  // TODO implement
  // 3: string;
  // 'extends': string;
  // [3]: string;
  // ['extends']: string;
}

export declare interface I {
  f(cb: (s: string) => void): void;

  x;
  z?;
  w?: number;

  readonly propertyRo: string;

  get getter(): number;
  set setter(value: number);
}
