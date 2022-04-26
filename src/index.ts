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
