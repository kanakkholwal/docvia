import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { c, log, symbols } from "../logger";
import {
	getScaffold,
	installHint,
	type RendererTemplate,
} from "../templates";

export interface InitOptions {
	dir: string;
	renderer?: RendererTemplate;
	force?: boolean;
}

const VALID_RENDERERS: RendererTemplate[] = ["react", "svelte", "none"];

function detectRenderer(projectDir: string): RendererTemplate {
	// Best-effort autodetection from package.json deps
	try {
		const pkgPath = join(projectDir, "package.json");
		if (!existsSync(pkgPath)) return "none";
		// Lazy import; avoid pulling fs/promises just for this
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const all = { ...pkg.dependencies, ...pkg.devDependencies };
		if (all.svelte || all["@sveltejs/kit"]) return "svelte";
		if (all.react || all.next) return "react";
		return "none";
	} catch {
		return "none";
	}
}

export async function runInit(opts: InitOptions): Promise<void> {
	const projectDir = resolve(opts.dir);
	const docsDir = join(projectDir, "docs");
	const configPath = join(projectDir, "docvia.config.ts");

	let renderer = opts.renderer ?? detectRenderer(projectDir);
	if (!VALID_RENDERERS.includes(renderer)) {
		log.warn(
			`Unknown --renderer "${renderer}", expected one of: ${VALID_RENDERERS.join(", ")}. Falling back to autodetect.`,
		);
		renderer = detectRenderer(projectDir);
	}

	if (existsSync(configPath) && !opts.force) {
		log.error(
			`${c.red("[ERROR]")} ${configPath} already exists. Re-run with --force to overwrite.`,
		);
		process.exitCode = 1;
		return;
	}

	await mkdir(docsDir, { recursive: true });

	const scaffold = getScaffold(renderer);
	await Promise.all([
		writeFile(join(docsDir, "index.md"), scaffold.indexMd, "utf-8"),
		writeFile(
			join(docsDir, "getting-started.md"),
			scaffold.gettingStartedMd,
			"utf-8",
		),
		writeFile(join(docsDir, "components.md"), scaffold.componentsMd, "utf-8"),
		writeFile(configPath, scaffold.configFile, "utf-8"),
	]);

	log.success("Project initialized");
	log.plain(`  Created ${c.cyan("docs/")} with sample documentation`);
	log.plain(`  Created ${c.cyan("docvia.config.ts")} (renderer: ${renderer})`);

	if (renderer === "none") {
		console.log("");
		log.warn("No renderer detected. Install one to enable builds:");
		log.plain(`    ${c.cyan(installHint(renderer))}`);
		log.plain(
			`  Then edit ${c.cyan("docvia.config.ts")} to wire the renderer.`,
		);
	} else {
		console.log("");
		log.plain(`  Install runtime peers if you haven't already:`);
		log.plain(`    ${c.cyan(installHint(renderer))}`);
	}

	console.log("");
	log.plain(`  Next: ${c.cyan("docvia build")} ${symbols.arrow} compile`);
	log.plain(`        ${c.cyan("docvia dev")}   ${symbols.arrow} watch & rebuild`);
}
