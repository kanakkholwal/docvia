// Package-manager selection for `docvia init`. Hand-rolled numbered prompt —
// no external prompt library, keeping the dependency surface (and supply-chain
// risk) minimal.
import { createInterface } from "node:readline/promises";
import { c } from "./logger";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: PackageManager[] = [
	"npm",
	"pnpm",
	"yarn",
	"bun",
];

/** The preferred default when nothing else is detected. */
const DEFAULT_PM: PackageManager = "pnpm";

export function isPackageManager(v: string): v is PackageManager {
	return (PACKAGE_MANAGERS as string[]).includes(v);
}

/**
 * Detect the package manager that invoked this process, via the
 * `npm_config_user_agent` env var every PM sets (e.g. `pnpm/9.0.0 ...`).
 */
export function detectPackageManager(): PackageManager | null {
	const ua = process.env.npm_config_user_agent ?? "";
	for (const pm of PACKAGE_MANAGERS) {
		if (ua.startsWith(`${pm}/`)) return pm;
	}
	return null;
}

// `add` installs a runtime dependency; `addDev` a dev dependency.
const COMMANDS: Record<PackageManager, { add: string; addDev: string }> = {
	npm: { add: "npm install", addDev: "npm install -D" },
	pnpm: { add: "pnpm add", addDev: "pnpm add -D" },
	yarn: { add: "yarn add", addDev: "yarn add -D" },
	bun: { add: "bun add", addDev: "bun add -d" },
};

/** Build an install command for the given package manager. */
export function addCmd(pm: PackageManager, pkgs: string, dev = false): string {
	const cmd = COMMANDS[pm];
	return `${dev ? cmd.addDev : cmd.add} ${pkgs}`;
}

/**
 * Ask which package manager to use. `pnpm` is the recommended default. When a
 * `preset` is supplied (the `--pm` flag) or stdin is not interactive, the
 * prompt is skipped and the detected — or default — manager is used.
 */
export async function promptPackageManager(
	preset?: PackageManager,
): Promise<PackageManager> {
	const fallback = preset ?? detectPackageManager() ?? DEFAULT_PM;
	if (preset || !process.stdin.isTTY) return fallback;

	console.log("");
	console.log(`  ${c.cyan("?")} ${c.bold("Preferred package manager")}`);
	PACKAGE_MANAGERS.forEach((pm, i) => {
		const marker = pm === fallback ? c.green("❯") : " ";
		const tag = pm === DEFAULT_PM ? c.gray(" (recommended)") : "";
		console.log(`  ${marker} ${c.bold(String(i + 1))}  ${pm}${tag}`);
	});

	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		for (let attempt = 0; attempt < 3; attempt++) {
			const answer = (
				await rl.question(
					`  ${c.gray(`› 1-${PACKAGE_MANAGERS.length} (Enter for ${fallback})`)} `,
				)
			).trim();
			if (answer === "") return fallback;
			const picked = PACKAGE_MANAGERS[Number.parseInt(answer, 10) - 1];
			if (picked) return picked;
			console.log(
				`  ${c.yellow("!")} Enter a number 1-${PACKAGE_MANAGERS.length}.`,
			);
		}
		return fallback;
	} finally {
		rl.close();
	}
}
