import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
	detectProject,
	FRAMEWORK_LABEL,
	type Framework,
	type Project,
} from "../init/detect";
import {
	dependenciesFor,
	installCommands,
	installDependencies,
} from "../init/install";
import {
	findConfig,
	findTailwindCss,
	type PatchResult,
	patchNextConfig,
	patchTailwindCss,
	patchViteConfig,
} from "../init/patch";
import { planFiles } from "../init/scaffold";
import { c, fmtMs } from "../logger";
import { isPackageManager } from "../pm";
import * as ui from "../ui";

export interface InitOptions {
	readonly dir: string;
	readonly framework?: string;
	readonly pm?: string;
	/** `false` from `--no-install`: print the install commands instead of running them. */
	readonly install: boolean;
	/** Accept every detected default without prompting. */
	readonly yes: boolean;
	/** Overwrite files that already exist. */
	readonly force: boolean;
}

const FRAMEWORKS = Object.keys(FRAMEWORK_LABEL) as Framework[];

const rel = (root: string, p: string) =>
	relative(root, p).split("\\").join("/") || ".";

function devUrl(project: Project): string {
	let script = "";
	try {
		const pkg = JSON.parse(
			readFileSync(join(project.root, "package.json"), "utf8"),
		);
		script = String(pkg.scripts?.dev ?? "");
	} catch {}
	const port =
		/--port[ =](\d+)|-p[ =](\d+)/.exec(script)?.slice(1).find(Boolean) ??
		(project.framework === "next" ? "3000" : "5173");
	return `http://localhost:${port}/docs`;
}

function patchConfig(project: Project): PatchResult | undefined {
	if (project.framework === "standalone") return undefined;
	const kind = project.framework === "next" ? "next" : "vite";
	const file = findConfig(project.root, kind);
	if (!file) throw new Error(`no ${kind}.config file found in ${project.root}`);
	return kind === "next" ? patchNextConfig(file) : patchViteConfig(file);
}

async function chooseFramework(
	opts: InitOptions,
	detected: Framework,
): Promise<Framework> {
	if (opts.framework) {
		if (FRAMEWORKS.includes(opts.framework as Framework)) {
			return opts.framework as Framework;
		}
		ui.message(
			c.yellow(
				`Unknown --framework "${opts.framework}"; expected ${FRAMEWORKS.join(" | ")}.`,
			),
		);
	}
	if (opts.yes || detected !== "standalone") return detected;
	return ui.select({
		message: "No supported framework found. Set up",
		options: FRAMEWORKS.map((value) => ({
			value,
			label: FRAMEWORK_LABEL[value],
		})),
		initialValue: detected,
	});
}

export async function runInit(opts: InitOptions): Promise<void> {
	const started = performance.now();
	ui.printBanner();
	ui.intro(c.bold("Add docs to your app"));

	try {
		const root = resolve(opts.dir);
		const detected = detectProject(root);
		const framework = await chooseFramework(opts, detected.framework);
		let project =
			framework === detected.framework
				? detected
				: detectProject(root, framework);
		if (opts.pm && isPackageManager(opts.pm)) {
			project = { ...project, pm: opts.pm, pmSource: "flag" };
		}

		const files = planFiles(project);
		const conflicts = files.filter((f) => f.exists);
		ui.note(
			[
				`${c.dim("framework")}  ${FRAMEWORK_LABEL[project.framework]}`,
				`${c.dim("packages ")}  ${project.pm} ${c.dim(`(${project.pmSource})`)}`,
				`${c.dim("content  ")}  content/docs`,
				`${c.dim("routes   ")}  ${project.framework === "standalone" ? "none" : `${rel(root, join(root, project.routesDir, "docs"))}/`}`,
			].join("\n"),
			basename(root),
		);

		if (!opts.yes && ui.isInteractive()) {
			const go = await ui.confirm({
				message: "Set it up?",
				initialValue: true,
			});
			if (!go) {
				ui.cancelOutro("Nothing written.");
				return;
			}
		}

		let overwrite = opts.force;
		if (conflicts.length > 0 && !overwrite && !opts.yes && ui.isInteractive()) {
			overwrite = await ui.confirm({
				message: `${conflicts.length} file(s) already exist. Overwrite them?`,
				initialValue: false,
			});
		}

		const written: string[] = [];
		const kept: string[] = [];
		for (const file of files) {
			if (file.exists && !overwrite) {
				kept.push(rel(root, file.path));
				continue;
			}
			await mkdir(dirname(file.path), { recursive: true });
			await writeFile(file.path, file.content);
			written.push(rel(root, file.path));
		}

		const manual: string[] = [];
		try {
			const patched = patchConfig(project);
			if (patched?.code) {
				await writeFile(patched.file, patched.code);
				written.push(`${rel(root, patched.file)} ${c.dim("(updated)")}`);
			}
		} catch (err) {
			manual.push(
				project.framework === "next"
					? `Wrap your Next config: ${c.brand("export default withDocvia()(config)")} from @docvia/build/next`
					: `Add ${c.brand("docvia()")} from @docvia/plugin-vite to your Vite plugins`,
				c.dim(`(${(err as Error).message})`),
			);
		}

		const css = findTailwindCss(root, [
			...new Set([
				project.routesDir,
				project.srcDir,
				join(project.srcDir, "styles"),
			]),
		]);
		const tailwind = css
			? patchTailwindCss(css, join(root, "content"))
			: undefined;
		if (tailwind?.code) {
			await writeFile(tailwind.file, tailwind.code);
			written.push(
				`${rel(root, tailwind.file)} ${c.dim("(Tailwind skips content/)")}`,
			);
		}

		const deps = dependenciesFor(project.framework);
		if (opts.install) {
			const spin = ui.spinner();
			const t0 = performance.now();
			spin.start(
				`Installing ${[...deps.runtime, ...deps.dev].length} packages with ${project.pm}`,
			);
			try {
				await installDependencies(root, project.pm, deps);
				spin.stop(
					`Installed with ${project.pm} in ${fmtMs(performance.now() - t0)}`,
				);
			} catch (err) {
				spin.stop("Install failed", false);
				process.exitCode = 1;
				manual.push(
					...installCommands(project.pm, deps).map((cmd) => c.brand(cmd)),
				);
				manual.push(c.dim((err as Error).message));
			}
		} else {
			manual.push(
				...installCommands(project.pm, deps).map((cmd) => c.brand(cmd)),
			);
		}

		await ui.streamNote(
			[
				...written.map((f) => `${c.green("+")} ${f}`),
				...kept.map((f) => `${c.dim(`= ${f} (kept, use --force to replace)`)}`),
			].join("\n"),
			`${written.length} file(s)`,
		);
		if (manual.length > 0) ui.note(manual.join("\n"), "Still to do");

		const run = project.pm === "npm" ? "npm run" : project.pm;
		const next =
			project.framework === "standalone"
				? `${c.brand(`${run} docvia dev`)}  ${c.dim("watch and rebuild content/docs")}`
				: `${c.brand(`${run} dev`)}  then open ${c.brand(devUrl(project))}`;
		ui.note(next, "Next");
		ui.outro(`Done in ${fmtMs(performance.now() - started)}`);
	} catch (err) {
		if (err instanceof ui.PromptCancelled) {
			ui.cancelOutro("Setup cancelled.");
			process.exitCode = 130;
			return;
		}
		throw err;
	}
}
