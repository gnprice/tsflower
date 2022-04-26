/**
 * CLI for TsFlower.
 *
 * For CLI usage, see `getUsage` below, or run:
 *
 *     $ tsflower --help
 */
import fs from "fs";
import process from "process";
import { convertFileToString } from "./index";

class CliError extends Error {
  readonly messages: string[];
  readonly exitCode: number;

  constructor(messages: string[], exitCode?: number) {
    super(messages[0]);
    this.messages = messages;
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
      for (const message of e.messages) {
        process.stderr.write(`tsflower: ${message}\n`);
      }
      process.stderr.write(getUsage());
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
      throw new CliError([], 0);
    case "file":
      return parseFileCommandLine(argv.slice(1));
    default:
      usageError(`invalid subcommand: ${argv[0]}`);
  }
}

function parseFileCommandLine(argv: string[]): CliCommand {
  if (argv.length < 1) {
    usageError("file: input filename required");
  }
  if (argv[0] === "--help") {
    throw new CliError([], 0);
  }
  if (argv.length > 2) {
    usageError(`file: too many arguments (got ${argv.length}, expected 2)`);
  }

  const [inputFilename, outputFilename] = argv;

  return {
    type: "file",
    src: inputFilename,
    dest: outputFilename !== undefined ? outputFilename : { type: "pipe" },
  };
}

function usageError(message: string): never {
  throw new CliError([message]);
}

function getUsage() {
  return `\
Usage: tsflower file INPUT [OUTPUT]

Consumes the TypeScript type definition (\`.d.ts\`) file INPUT,
and generates a Flow type definition (\`.js.flow\`) file at OUTPUT.

If OUTPUT is omitted, prints result to stdout.
`;
}
