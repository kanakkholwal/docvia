#!/usr/bin/env node
import { defineConfig } from "@docvia/plugins";
import { Command } from "commander";
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runBuild } from "./commands/build";
import { runDev } from "./commands/dev";
import { runInit } from "./commands/init";
import { runPreview } from "./commands/preview";
import type { RendererTemplate } from "./templates";

// Re-export defineConfig so users can import it from "@docvia/cli"
export { defineConfig };
export type { docviaConfig, docviaPlugin } from "@docvia/ir";

const VERSION = process.env.npm_package_version ?? "0.1.0";

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
		.option("-f, --force", "Overwrite existing docvia.config.ts", false)
		.action(
			async (opts: { dir: string; renderer?: string; force?: boolean }) => {
				await runInit({
					dir: opts.dir,
					renderer: opts.renderer as RendererTemplate | undefined,
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
		.action(
			async (opts: {
				docs?: string;
				out?: string;
				config?: string;
				cache?: boolean;
			}) => {
				// commander maps --no-cache to opts.cache === false
				await runBuild({
					docs: opts.docs,
					out: opts.out,
					config: opts.config,
					noCache: opts.cache === false,
				});
			},
		);

	program
		.command("dev")
		.description("Watch for changes and rebuild incrementally")
		.option("--docs <dir>", "Docs directory (overrides config)")
		.option("--out <dir>", "Output directory (overrides config)")
		.option("--config <path>", "Config file path", "./docvia.config.ts")
		.action(async (opts: { docs?: string; out?: string; config?: string }) => {
			await runDev(opts);
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
 * Detect whether this module is being executed as a CLI entry point vs being
 * imported as a library (e.g. from a docvia.config.ts that does
 * `import { defineConfig } from "@docvia/cli"`).
 *
 * We compare the resolved real path of the entry script (process.argv[1]) with
 * the resolved real path of this module. This handles symlinks, pnpm bin
 * shims, and `node ./dist/index.mjs` invocations.
 */
function isCliEntry(): boolean {
	const argv1 = process.argv[1];
	if (!argv1) return false;
	try {
		const entryUrl = pathToFileURL(realpathSync(argv1)).href;
		const moduleUrl = pathToFileURL(realpathSync(fileURLToPath(import.meta.url)))
			.href;
		return entryUrl === moduleUrl;
	} catch {
		// Fall back to substring check for edge cases (Windows .cmd shims etc.)
		return /[\\/]docvia(\.m?js|\.cmd|\.ps1)?$/i.test(argv1);
	}
}

if (isCliEntry()) {
	const program = buildProgram();
	program.parseAsync(process.argv).catch((err) => {
		// Last-ditch error handler — individual commands already format their own.
		console.error(err);
		process.exit(1);
	});
}
