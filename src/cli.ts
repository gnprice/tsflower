/**
 * CLI for TsFlower.
 *
 * For CLI usage, see `printUsage` below, or run:
 *
 *     $ tsflower --help
 */
import process from "process";
import { convertFileToString } from "./index";

main();

function main() {
  const argv = process.argv.slice(2);

  if (argv.length !== 1) {
    usageError();
  }

  if (argv[0] === "--help") {
    printUsage();
    process.exit(0);
  }

  const [inputFilename] = argv;

  process.stdout.write(convertFileToString(inputFilename));
}

function usageError(): never {
  printUsage();
  process.exit(1);
}

function printUsage() {
  process.stderr.write(`\
Usage: tsflower path/to/some/file.d.ts

Prints result to stdout.
`);
}
