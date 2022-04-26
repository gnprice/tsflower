/**
 * Usage: tsflower path/to/some/file.d.ts
 *
 * Prints result to stdout.
 *
 * Example:
 *   $ bin/tsflower integration/node_modules/react-native-gesture-handler/lib/typescript/index.d.ts
 */
import process from "process";
import { convertFileToString } from "./index";

main();

function main() {
  process.stdout.write(convertFileToString(process.argv[2]));
}
