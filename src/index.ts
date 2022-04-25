/**
 * Usage: node . path/to/some/file.d.ts
 *
 * Prints result to stdout.
 *
 * Example:
 *   $ node . integration/node_modules/react-native-gesture-handler/lib/typescript/index.d.ts
 */
import ts from "typescript";
import * as recast from "recast";
import process from "process";
import { convertSourceFile } from "./convert";

main();

function main() {
  process.stdout.write(convertFileToString(process.argv[2]));
}

function convertFileToString(file: string): string {
  const program = ts.createProgram({
    rootNames: [file],
    options: {},
  });
  program.getTypeChecker(); // causes the binder to run, and set parent pointers
  const sourceFile = program.getSourceFile(file);
  if (!sourceFile) throw 0;
  const convertedFile = convertSourceFile(sourceFile);
  return recast.print(convertedFile).code + "\n";
}
