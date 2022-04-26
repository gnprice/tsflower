import fs from "fs";
import path from "path";
import ts from "typescript";
import * as recast from "recast";
import { convertSourceFile } from "./convert";
import { createMapper } from "./mapper";

export function convertFileToString(file: string): string {
  const program = ts.createProgram({
    rootNames: [file],
    options: {},
  });
  program.getTypeChecker(); // causes the binder to run, and set parent pointers

  const mapper = createMapper(program, [file]);

  const sourceFile = program.getSourceFile(file);
  if (!sourceFile) throw 0;
  const convertedFile = convertSourceFile(sourceFile, mapper, program);
  return recast.print(convertedFile).code + "\n";
}

export function convertFileTree(src: string, dest: string) {
  const { inputs, outputs } = collectInputsFromTree(src, dest);
  const program = ts.createProgram({
    rootNames: inputs,
    options: {},
  });
  program.getTypeChecker(); // causes the binder to run, and set parent pointers

  const mapper = createMapper(program, inputs);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const output = outputs[i];

    const sourceFile = program.getSourceFile(input);
    if (!sourceFile) throw 0;
    const convertedFile = convertSourceFile(sourceFile, mapper, program);
    const convertedText = recast.print(convertedFile).code + "\n";

    fs.mkdirSync(path.dirname(output));
    fs.writeFileSync(output, convertedText);
  }
}

function collectInputsFromTree(
  src: string,
  dest: string
): { inputs: string[]; outputs: string[] } {
  // TODO implement
  throw new Error("tsflower tree: collectInputsFromTree unimplemented");
}
