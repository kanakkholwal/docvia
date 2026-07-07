#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "@docvia/plugins";
import { Command } from "commander";
import { runBuild } from "./commands/build";
import { runDev } from "./commands/dev";
import { runInit } from "./commands/init";
import { runPreview } from "./commands/preview";
import type { RendererTemplate } from "./templates";
import { getVersion } from "./version";

export type { docviaConfig, docviaPlugin } from "@docvia/ir";
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
		.description("Scaffold a new docvia project")
		.option("-d, --dir <dir>", "Project directory", ".")
		.option(
			"-r, --renderer <renderer>",
			"Renderer template: react | svelte | none (default: autodetect)",
		)
		.option(
			"--pm <manager>",
			"Package manager: npm | pnpm | yarn | bun (default: prompt)",
		)
		.option("-f, --force", "Overwrite existing docvia.config.ts", false)
		.action(
			async (opts: {
				dir: string;
				renderer?: string;
				pm?: string;
				force?: boolean;
			}) => {
				await runInit({
					dir: opts.dir,
					renderer: opts.renderer as RendererTemplate | undefined,
					pm: opts.pm,
					force: opts.force,
				});
			},
		);

	program
		.command("build")
		.description("Compile documentation")
		.option("--docs <dir>", "Docs directory (overrides config)")
		.option("--out <dir>", "Output directory (overrides config)")
		.option("--config <path>", "Config file path", "./docvia.config.ts")
		.option("--no-cache", "Disable incremental cache; force full rebuild")
		.option("-v, --verbose", "Show intermediate build steps in detail", false)
		.action(
			async (opts: {
				docs?: string;
				out?: string;
				config?: string;
				cache?: boolean;
				verbose?: boolean;
			}) => {
				// commander maps --no-cache to opts.cache === false
				await runBuild({
					docs: opts.docs,
					out: opts.out,
					config: opts.config,
					noCache: opts.cache === false,
					verbose: opts.verbose,
				});
			},
		);

	program
		.command("dev")
		.description("Watch for changes and rebuild incrementally")
		.option("--docs <dir>", "Docs directory (overrides config)")
		.option("--out <dir>", "Output directory (overrides config)")
		.option("--config <path>", "Config file path", "./docvia.config.ts")
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
 * Detect direct invocation as `node ./dist/index.mjs` (vs being imported as a
 * library from a `docvia.config.ts` or from `bin.mjs`).
 *
 * We compare the resolved real path of the entry script (`process.argv[1]`)
 * with the resolved real path of this module. The bin shim sets argv[1] to
 * `bin.mjs`, so this check stays false in that path — `bin.mjs` calls
 * `runCli()` explicitly.
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
