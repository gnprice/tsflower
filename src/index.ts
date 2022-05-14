import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import * as recast from 'recast';
import { convertSourceFile } from './convert';
import { createMapper } from './mapper';

export function convertFileToString(file: string): string {
  const program = createProgram([file]);

  const mapper = createMapper(program, [file]);

  const sourceFile = program.getSourceFile(file);
  if (!sourceFile) {
    // This happens if the given file doesn't exist.
    // TODO(error): nicer CLI error
    throw new Error(`source file not found: ${file}`);
  }
  const convertedFile = convertSourceFile(sourceFile, mapper, program);
  return recast.print(convertedFile).code + '\n';
}

export function convertFileTree(src: string, dest: string) {
  // TODO(error): nicer error output if src doesn't exist (or other I/O error?)
  const { inputs, outputs } = collectInputsFromTree(src, dest);

  const program = createProgram(inputs);

  const mapper = createMapper(program, inputs);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const output = outputs[i];

    const sourceFile = program.getSourceFile(input);
    if (!sourceFile) {
      // This happens if the given file doesn't exist.  It's a file we just
      // found by walking the tree, but this could still happen if something
      // concurrently deleted it.
      // TODO(error): nicer CLI error
      throw new Error(`source file not found: ${input}`);
    }
    const convertedFile = convertSourceFile(sourceFile, mapper, program);
    const convertedText = recast.print(convertedFile).code + '\n';

    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, convertedText);
  }
}

function createProgram(rootNames: readonly string[]) {
  const program = ts.createProgram({ rootNames, options: {} });

  program.getTypeChecker(); // causes the binder to run, and set parent pointers

  const errors = [];
  for (const diag of program.getConfigFileParsingDiagnostics()) {
    if (diag.category === ts.DiagnosticCategory.Error) errors.push(diag);
  }
  for (const diag of program.getOptionsDiagnostics()) {
    // If one of the `rootNames` files didn't exist, this is where the error appears.
    if (diag.category === ts.DiagnosticCategory.Error) errors.push(diag);
  }
  if (errors.length) {
    // TODO(error): nicer CLI error
    throw new Error(
      `There were TS errors:\n${errors
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n', 2))
        .join('\n')}`,
    );
  }

  // Other kinds of TS diagnostics:
  //   program.getGlobalDiagnostics()
  //   program.getSyntacticDiagnostics()
  //   program.getSemanticDiagnostics()
  //   program.getDeclarationDiagnostics()
  // Perhaps warn on those?

  return program;
}

function collectInputsFromTree(
  src: string,
  dest: string,
): { inputs: string[]; outputs: string[] } {
  const inputs: string[] = [];
  const outputs: string[] = [];

  walk(fs.opendirSync(src), '');

  return { inputs, outputs };

  function walk(dir: fs.Dir, dirName: string) {
    let dirent;
    while ((dirent = dir.readSync())) {
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.d.ts')) {
          const outputName = dirent.name.replace(/\.d\.ts$/, '.js.flow');
          inputs.push(path.join(src, dirName, dirent.name));
          outputs.push(path.join(dest, dirName, outputName));
        }
        // else it's some other file; ignore
      } else if (dirent.isDirectory()) {
        const subdirName = path.join(dirName, dirent.name);
        walk(fs.opendirSync(path.join(src, subdirName)), subdirName);
      } else {
        // Ignore symlinks.  Ignore fifos, sockets, and devices.
      }
    }
  }
}
