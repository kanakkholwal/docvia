#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "@docvia/core";
import { Command } from "commander";
import { runBuild } from "./commands/build";
import { runDev } from "./commands/dev";
import { runInit } from "./commands/init";
import { runPreview } from "./commands/preview";
import { runSync } from "./commands/sync";
import { getVersion } from "./version";

export type { docviaConfig, docviaPlugin } from "@docvia/core";
// Re-export defineConfig so users can import it from "@docvia/cli"
export { defineConfig };

const VERSION = getVersion();

function buildProgram(): Command {
	const program = new Command();

	program
		.name("docvia")
		.description("docvia — Build-time documentation compiler")
		.version(VERSION);

	program
		.command("init")
		.description("Add docs to a Next.js, SvelteKit or TanStack Start app")
		.argument("[dir]", "App directory", ".")
		.option(
			"--framework <name>",
			"next | sveltekit | tanstack-start | standalone (default: detected)",
		)
		.option("--pm <manager>", "npm | pnpm | yarn | bun (default: detected)")
		.option(
			"--no-install",
			"Print the install commands instead of running them",
		)
		.option("-y, --yes", "Accept detected defaults without prompting", false)
		.option("-f, --force", "Overwrite files that already exist", false)
		.action(
			async (
				dir: string,
				opts: {
					framework?: string;
					pm?: string;
					install: boolean;
					yes: boolean;
					force: boolean;
				},
			) => {
				await runInit({ dir, ...opts });
			},
		);

	program
		.command("build")
		.description("Compile documentation")
		.option("--docs <dir>", "Docs directory (overrides config)")
		.option("--out <dir>", "Output directory (overrides config)")
		.option("--config <path>", "Config file path (default: auto-detect)")
		.option("-v, --verbose", "Show intermediate build steps in detail", false)
		.action(
			async (opts: {
				docs?: string;
				out?: string;
				config?: string;
				verbose?: boolean;
			}) => {
				await runBuild({
					docs: opts.docs,
					out: opts.out,
					config: opts.config,
					verbose: opts.verbose,
				});
			},
		);

	program
		.command("dev")
		.description("Watch for changes and rebuild incrementally")
		.option("--docs <dir>", "Docs directory (overrides config)")
		.option("--out <dir>", "Output directory (overrides config)")
		.option("--config <path>", "Config file path (default: auto-detect)")
		.option("-v, --verbose", "Show each changed file as it rebuilds", false)
		.action(
			async (opts: {
				docs?: string;
				out?: string;
				config?: string;
				verbose?: boolean;
			}) => {
				await runDev(opts);
			},
		);

	program
		.command("sync")
		.description(
			"Generate .docvia types without a bundler (run before tsc / svelte-check)",
		)
		.option("--config <path>", "Config file path (default: auto-detect)")
		.action(async (opts: { config?: string }) => {
			await runSync(opts);
		});

	program
		.command("preview")
		.description("Serve the compiled .docvia/ output (sanity check only)")
		.option("--out <dir>", "Output directory", ".docvia")
		.option("-p, --port <port>", "Port", "4173")
		.action(async (opts: { out: string; port: string }) => {
			await runPreview(opts);
		});

	return program;
}

/**
 * Programmatic entry point. The `bin.mjs` shim calls this directly, and any
 * downstream tooling that wants to run the docvia CLI in-process can do the
 * same. Resolves once the parsed command finishes; rejects on parser errors.
 */
export async function runCli(
	argv: readonly string[] = process.argv,
): Promise<void> {
	const program = buildProgram();
	await program.parseAsync(argv as string[]);
}

/**
 * True for `node ./dist/index.js`; false when imported, including from `bin.mjs`,
 * which calls `runCli()` itself.
 */
function isDirectInvocation(): boolean {
	const argv1 = process.argv[1];
	if (!argv1) return false;
	try {
		const entryUrl = pathToFileURL(realpathSync(argv1)).href;
		const moduleUrl = pathToFileURL(
			realpathSync(fileURLToPath(import.meta.url)),
		).href;
		return entryUrl === moduleUrl;
	} catch {
		return false;
	}
}

if (isDirectInvocation()) {
	runCli().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
