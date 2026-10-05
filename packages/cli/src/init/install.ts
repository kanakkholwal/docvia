import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { PackageManager } from "../pm";
import type { Framework } from "./detect";

export interface Dependencies {
	readonly runtime: readonly string[];
	readonly dev: readonly string[];
}

export function dependenciesFor(framework: Framework): Dependencies {
	switch (framework) {
		case "next":
			return {
				runtime: ["@docvia/source", "@docvia/renderer-react", "@docvia/search"],
				dev: ["@docvia/plugin-next", "@docvia/plugin-shiki"],
			};
		case "sveltekit":
			return {
				runtime: [
					"@docvia/source",
					"@docvia/renderer-svelte",
					"@docvia/search",
				],
				dev: ["@docvia/plugin-vite", "@docvia/plugin-shiki"],
			};
		case "tanstack-start":
			return {
				runtime: ["@docvia/source", "@docvia/renderer-react", "@docvia/search"],
				dev: ["@docvia/plugin-vite", "@docvia/plugin-shiki"],
			};
		case "standalone":
			return { runtime: [], dev: ["@docvia/cli", "@docvia/plugin-shiki"] };
	}
}

/**
 * `DOCVIA_TARBALLS=<dir>` installs packed `@docvia/*` tarballs instead of the registry, so
 * unreleased builds can be tried in a fresh app. Maps package name to `file:` spec.
 */
function localTarballs(): Map<string, string> | undefined {
	const dir = process.env.DOCVIA_TARBALLS;
	if (!dir) return undefined;
	const specs = new Map<string, string>();
	for (const file of readdirSync(dir)) {
		const match = /^docvia-(.+)-\d+\.\d+\.\d+.*\.tgz$/.exec(file);
		if (match)
			specs.set(
				`@docvia/${match[1]}`,
				`file:${resolve(dir, file).split("\\").join("/")}`,
			);
	}
	return specs;
}

/** Pins every `@docvia/*` (including transitive ones) to the local tarballs. */
function writeOverrides(
	root: string,
	pm: PackageManager,
	specs: Map<string, string>,
): void {
	if (pm === "pnpm") {
		const file = join(root, "pnpm-workspace.yaml");
		const yaml = existsSync(file) ? readFileSync(file, "utf8") : "";
		if (/^overrides:/m.test(yaml)) return;
		const lines = [...specs].map(([name, spec]) => `  '${name}': '${spec}'`);
		writeFileSync(
			file,
			`${yaml.trimEnd()}\noverrides:\n${lines.join("\n")}\n`.trimStart(),
		);
		return;
	}
	const pkgFile = join(root, "package.json");
	const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
	pkg.overrides = { ...pkg.overrides, ...Object.fromEntries(specs) };
	writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
}

const ADD: Record<PackageManager, { add: string[]; dev: string }> = {
	npm: { add: ["install"], dev: "-D" },
	pnpm: { add: ["add"], dev: "-D" },
	yarn: { add: ["add"], dev: "-D" },
	bun: { add: ["add"], dev: "-d" },
};

function run(cmd: string, args: string[], cwd: string): Promise<void> {
	return new Promise((done, fail) => {
		const child = spawn(cmd, args, {
			cwd,
			shell: process.platform === "win32",
		});
		let output = "";
		child.stdout?.on("data", (d) => {
			output += d;
		});
		child.stderr?.on("data", (d) => {
			output += d;
		});
		child.on("error", fail);
		child.on("close", (code) =>
			code === 0
				? done()
				: fail(
						new Error(
							`${cmd} ${args.join(" ")} failed:\n${output.trim().split("\n").slice(-15).join("\n")}`,
						),
					),
		);
	});
}

/** The install commands, as shown to the user when `--no-install` is passed. */
export function installCommands(
	pm: PackageManager,
	deps: Dependencies,
): string[] {
	const add = [pm, ...ADD[pm].add].join(" ");
	return [
		deps.runtime.length ? `${add} ${deps.runtime.join(" ")}` : "",
		deps.dev.length ? `${add} ${ADD[pm].dev} ${deps.dev.join(" ")}` : "",
	].filter(Boolean);
}

export async function installDependencies(
	root: string,
	pm: PackageManager,
	deps: Dependencies,
): Promise<void> {
	const local = localTarballs();
	if (local) writeOverrides(root, pm, local);
	const spec = (name: string) => local?.get(name) ?? name;
	const add = ADD[pm].add;
	if (deps.runtime.length)
		await run(pm, [...add, ...deps.runtime.map(spec)], root);
	if (deps.dev.length)
		await run(pm, [...add, ADD[pm].dev, ...deps.dev.map(spec)], root);
}
