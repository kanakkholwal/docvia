// Package-manager data for `docvia init`. Detection + command-string helpers;
// the actual "which manager?" question is asked by the interactive UI toolkit
// (see `commands/init.ts`). No external prompt library — the dependency surface
// (and supply-chain risk) stays minimal.
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: PackageManager[] = [
	"npm",
	"pnpm",
	"yarn",
	"bun",
];

/** The preferred default when nothing else is detected. */
export const DEFAULT_PM: PackageManager = "pnpm";

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
