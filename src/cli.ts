/**
 * CLI for TsFlower.
 *
 * For CLI usage, see `getUsage` below, or run:
 *
 *     $ tsflower --help
 */
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

interface CliCommand {
  readonly inputFilename: string;
}

main();

function main() {
  const argv = process.argv.slice(2);

  const command = parseCommandLineOrExit(argv);

  process.stdout.write(convertFileToString(command.inputFilename));
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
  if (argv.length !== 1) {
    usageError("require 1 argument");
  }

  if (argv[0] === "--help") {
    throw new CliError([], 0);
  }

  const [inputFilename] = argv;

  return {
    inputFilename,
  };
}

function usageError(message: string): never {
  throw new CliError([message]);
}

function getUsage() {
  return `\
Usage: tsflower path/to/some/file.d.ts

Prints result to stdout.
`;
}
