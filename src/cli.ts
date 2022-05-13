/**
 * CLI for TsFlower.
 *
 * For CLI usage, run:
 *
 *     $ tsflower --help
 */
import fs from "fs";
import process from "process";
import { ensureUnreachable } from "./generics";
import { convertFileToString, convertFileTree } from "./index";

class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode?: number) {
    super(message);
    this.exitCode = exitCode ?? 1;
  }
}

type FilenameOrPipe = string | { kind: "pipe" };

type CliCommand =
  | { kind: "file"; src: string; dest: FilenameOrPipe }
  | { kind: "tree"; src: string; dest: string | null };

main();

function main() {
  const argv = process.argv.slice(2);

  const command = parseCommandLineOrExit(argv);

  switch (command.kind) {
    case "file": {
      const { src, dest } = command;
      const result = convertFileToString(src);
      if (typeof dest === "object") {
        process.stdout.write(result);
      } else {
        fs.writeFileSync(dest, result);
      }
      return;
    }

    case "tree": {
      const { src, dest } = command;
      convertFileTree(src, dest ?? src);
      return;
    }

    default:
      ensureUnreachable(command);
      // @ts-expect-error yes, the types say this is unreachable
      throw new Error(`internal error: unexpected subcommand: ${command.kind}`);
  }
}

function parseCommandLineOrExit(argv: string[]): CliCommand {
  try {
    return parseCommandLine(argv);
  } catch (e) {
    if (e instanceof CliError) {
      process.stderr.write(e.message);
      process.exit(e.exitCode);
    }

    throw e;
  }
}

function parseCommandLine(argv: string[]): CliCommand {
  if (argv.length < 1) {
    usageError("subcommand required");
  }

  switch (argv[0]) {
    case "--help":
      throw new CliError(getUsage(), 0);
    case "file":
      return parseFileCommandLine(argv.slice(1));
    case "tree":
      return parseTreeCommandLine(argv.slice(1));
    default:
      usageError(`invalid subcommand: ${argv[0]}`);
  }

  function usageError(message: string): never {
    throw new CliError(`tsflower: ${message}\n${getUsage()}`);
  }

  function getUsage() {
    return `\
Usage: tsflower SUBCOMMAND [ARGS...]
       tsflower SUBCOMMAND --help

Consume TypeScript type definition files (\`.d.ts\`), and generate
corresponding Flow type definition files (\`.js.flow\`).

Subcommands:
  file - Translate a single file.
  tree - Translate a directory tree of files.

For details on any subcommand, pass \`--help\` to the subcommand.
`;
  }
}

function parseFileCommandLine(argv: string[]): CliCommand {
  if (argv.length < 1) {
    usageError("input filename required");
  }
  if (argv[0] === "--help") {
    throw new CliError(getUsage(), 0);
  }
  if (argv.length > 2) {
    usageError(`too many arguments (got ${argv.length}, expected 2)`);
  }

  const [inputFilename, outputFilename] = argv;

  return {
    kind: "file",
    src: inputFilename,
    dest: outputFilename !== undefined ? outputFilename : { kind: "pipe" },
  };

  function usageError(message: string): never {
    throw new CliError(`tsflower file: ${message}\n${getUsage()}`);
  }

  function getUsage() {
    return `\
Usage: tsflower file INPUT [OUTPUT]

Consumes the TypeScript type definition (\`.d.ts\`) file INPUT,
and generates a Flow type definition (\`.js.flow\`) file at OUTPUT.

If OUTPUT is omitted, prints result to stdout.
`;
  }
}

function parseTreeCommandLine(argv: string[]): CliCommand {
  if (argv.length < 1) {
    usageError("input filename required");
  }
  if (argv[0] === "--help") {
    throw new CliError(getUsage(), 0);
  }
  if (argv.length > 2) {
    usageError(`too many arguments (got ${argv.length}, expected 2)`);
  }

  const [inputPath, outputPath] = argv;

  return {
    kind: "tree",
    src: inputPath,
    dest: outputPath !== undefined ? outputPath : null,
  };

  function usageError(message: string): never {
    throw new CliError(`tsflower tree: ${message}\n${getUsage()}`);
  }

  function getUsage() {
    return `\
Usage: tsflower tree INPUT [OUTPUT]

Consumes all TypeScript type definition (\`.d.ts\`) files under the
directory tree INPUT, and generates a corresponding tree of Flow type
definition (\`.js.flow\`) files at OUTPUT.

If OUTPUT is omitted, it defaults to the same as INPUT.  This has the effect
that each \`foo/bar.d.ts\` produces a file \`foo/bar.js.flow\` next to it.
`;
  }
}
