#!/usr/bin/env node
// Stable bin entrypoint for the docvia CLI.
//
// This file is checked into git so pnpm/npm can always create the bin link at
// install time, even before `pnpm build` has produced dist/. The actual CLI
// implementation is dynamically imported from dist/index.mjs at run time.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(here, "dist/index.mjs");

if (!existsSync(distEntry)) {
	console.error(
		"\x1b[31m[docvia]\x1b[0m CLI build artifacts not found at dist/index.mjs.\n" +
			"  In a workspace checkout, run `pnpm build` (or `pnpm --filter @docvia/cli build`)\n" +
			"  before invoking `docvia`.",
	);
	process.exit(1);
}

// Use a file:// URL so dynamic import works on Windows (where absolute paths
// like `c:\…` aren't valid ESM specifiers).
await import(pathToFileURL(distEntry).href);
