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
