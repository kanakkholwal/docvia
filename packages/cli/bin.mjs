#!/usr/bin/env node
// Committed so the bin link exists before `pnpm build`; loads dist/index.js at run time.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(here, "dist/index.js");

if (!existsSync(distEntry)) {
	console.error(
		"\x1b[31m[docvia]\x1b[0m CLI build artifacts not found at dist/index.js.\n" +
			"  In a workspace checkout, run `pnpm build` (or `pnpm --filter @docvia/cli build`)\n" +
			"  before invoking `docvia`.",
	);
	process.exit(1);
}

// Use a file:// URL so dynamic import works on Windows (where absolute paths
// like `c:\…` aren't valid ESM specifiers).
const cli = await import(pathToFileURL(distEntry).href);

try {
	await cli.runCli(process.argv);
} catch (err) {
	// Individual commands print their own formatted errors. This is just the
	// last-ditch handler for parser failures and unexpected throws.
	console.error(err);
	process.exit(1);
}
