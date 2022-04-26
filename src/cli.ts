/**
 * CLI for TsFlower.
 *
 * For CLI usage, run:
 *
 *     $ tsflower --help
 */
import fs from "fs";
import process from "process";
import { convertFileToString } from "./index";

class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode?: number) {
    super(message);
    this.exitCode = exitCode ?? 1;
  }
}

type FilenameOrPipe = string | { type: "pipe" };

type CliCommand = { type: "file"; src: string; dest: FilenameOrPipe };

main();

function main() {
  const argv = process.argv.slice(2);

  const command = parseCommandLineOrExit(argv);

  switch (command.type) {
    case "file": {
      const { src, dest } = command;
      const result = convertFileToString(src);
      if (typeof dest === "object") {
        process.stdout.write(result);
      } else {
        fs.writeFileSync(dest, result);
      }
    }
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
    type: "file",
    src: inputFilename,
    dest: outputFilename !== undefined ? outputFilename : { type: "pipe" },
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
