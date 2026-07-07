import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { c } from "../logger";
import {
	DEFAULT_PM,
	detectPackageManager,
	isPackageManager,
	type PackageManager,
} from "../pm";
import { getScaffold, installHint, type RendererTemplate } from "../templates";
import * as ui from "../ui";

export interface InitOptions {
	dir: string;
	renderer?: RendererTemplate;
	force?: boolean;
	/** Preferred package manager from `--pm`; prompts when omitted. */
	pm?: string;
}

const VALID_RENDERERS: RendererTemplate[] = ["react", "svelte", "none"];

const RENDERER_OPTIONS: Array<ui.SelectOption<RendererTemplate>> = [
	{ value: "react", label: "React", hint: "React / Next.js" },
	{ value: "svelte", label: "Svelte", hint: "Svelte / SvelteKit" },
	{ value: "none", label: "None", hint: "wire a renderer later" },
];

const PM_OPTIONS: Array<ui.SelectOption<PackageManager>> = [
	{ value: "pnpm", label: "pnpm", hint: "recommended" },
	{ value: "npm", label: "npm" },
	{ value: "yarn", label: "yarn" },
	{ value: "bun", label: "bun" },
];

function detectRenderer(projectDir: string): RendererTemplate {
	// Best-effort autodetection from package.json deps
	try {
		const pkgPath = join(projectDir, "package.json");
		if (!existsSync(pkgPath)) return "none";
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

/** Path relative to the cwd — friendlier than an absolute path. */
function rel(p: string): string {
	const r = relative(process.cwd(), p);
	return r === "" ? "." : r;
}

export async function runInit(opts: InitOptions): Promise<void> {
	ui.printBanner();
	ui.intro(c.bold("New documentation project"));

	try {
		// 1 — Where. The directory drives renderer autodetection, so ask it first.
		const dir = await ui.text({
			message: "Project directory",
			placeholder: ".",
			defaultValue: opts.dir || ".",
			initialValue: opts.dir && opts.dir !== "." ? opts.dir : "",
		});
		const projectDir = resolve(dir);

		// 2 — Renderer. Honor a valid --renderer; otherwise offer a pick seeded
		// with what we can autodetect from the project's package.json.
		const detected = detectRenderer(projectDir);
		let renderer: RendererTemplate;
		if (opts.renderer && VALID_RENDERERS.includes(opts.renderer)) {
			renderer = opts.renderer;
		} else {
			if (opts.renderer) {
				ui.message(
					c.yellow(
						`Unknown --renderer "${opts.renderer}"; falling back to a pick.`,
					),
				);
			}
			renderer = await ui.select({
				message: "Which renderer?",
				options: RENDERER_OPTIONS,
				initialValue: detected,
			});
		}

		// 3 — Package manager. Honor a valid --pm; otherwise pick, seeded from the
		// manager that invoked us (npm_config_user_agent) or the default.
		let pm: PackageManager;
		if (opts.pm && isPackageManager(opts.pm)) {
			pm = opts.pm;
		} else {
			if (opts.pm) {
				ui.message(
					c.yellow(`Unknown --pm "${opts.pm}"; falling back to a pick.`),
				);
			}
			pm = await ui.select({
				message: "Package manager",
				options: PM_OPTIONS,
				initialValue: detectPackageManager() ?? DEFAULT_PM,
			});
		}

		// 4 — Sample content. Handy on a fresh project, noise on an existing one.
		const includeSamples = await ui.confirm({
			message: "Add sample documentation pages?",
			initialValue: true,
		});

		// 5 — Overwrite guard. Interactive runs ask; scripted runs need --force.
		const configPath = join(projectDir, "docvia.config.ts");
		if (existsSync(configPath) && !opts.force) {
			if (ui.isInteractive()) {
				const overwrite = await ui.confirm({
					message: `${c.cyan("docvia.config.ts")} already exists. Overwrite?`,
					initialValue: false,
				});
				if (!overwrite) {
					ui.cancelOutro("Left your existing config untouched.");
					return;
				}
			} else {
				ui.cancelOutro(
					`${configPath} already exists. Re-run with --force to overwrite.`,
				);
				process.exitCode = 1;
				return;
			}
		}

		// 6 — Scaffold.
		const spin = ui.spinner();
		spin.start("Scaffolding project…");

		const docsDir = join(projectDir, "docs");
		await mkdir(docsDir, { recursive: true });

		const scaffold = getScaffold(renderer, pm);
		const created: string[] = ["docs/index.md", "docvia.config.ts"];
		const writes: Array<Promise<void>> = [
			writeFile(join(docsDir, "index.md"), scaffold.indexMd, "utf-8"),
			writeFile(configPath, scaffold.configFile, "utf-8"),
		];
		if (includeSamples) {
			writes.push(
				writeFile(
					join(docsDir, "getting-started.md"),
					scaffold.gettingStartedMd,
					"utf-8",
				),
				writeFile(
					join(docsDir, "components.md"),
					scaffold.componentsMd,
					"utf-8",
				),
			);
			created.splice(1, 0, "docs/getting-started.md", "docs/components.md");
		}
		await Promise.all(writes);
		spin.stop(`Scaffolded into ${c.cyan(rel(projectDir))}`);

		// 7 — Summary + next steps.
		ui.note(
			created.map((f) => `${c.green("+")} ${c.cyan(f)}`).join("\n"),
			`Created ${created.length} files (renderer: ${renderer})`,
		);

		const steps: string[] = [];
		if (renderer === "none") {
			steps.push(
				`${c.dim("1.")} Install a renderer:`,
				`   ${c.cyan(installHint(renderer, pm))}`,
				`${c.dim("2.")} Wire it up in ${c.cyan("docvia.config.ts")}`,
				`${c.dim("3.")} ${c.cyan("docvia build")}`,
			);
		} else {
			steps.push(
				`${c.dim("1.")} Install runtime peers:`,
				`   ${c.cyan(installHint(renderer, pm))}`,
				`${c.dim("2.")} ${c.cyan("docvia build")}  ${c.dim("compile")}`,
				`   ${c.cyan("docvia dev")}    ${c.dim("watch & rebuild")}`,
			);
		}
		ui.note(steps.join("\n"), "Next steps");

		ui.outro(`You're all set. Happy documenting ${c.magenta("✨")}`);
	} catch (err) {
		if (err instanceof ui.PromptCancelled) {
			ui.cancelOutro("Setup cancelled.");
			process.exitCode = 130;
			return;
		}
		throw err;
	}
}
