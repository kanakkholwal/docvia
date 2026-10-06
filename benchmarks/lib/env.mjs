import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { cpus, hostname, platform, release, totalmem } from "node:os";
import { join } from "node:path";

const quiet = (cmd, cwd) => {
	try {
		return execSync(cmd, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return undefined;
	}
};

/** Where and on what the run happened, so numbers from different machines are never mixed up. */
export function environment(repo) {
	return {
		machine: {
			cpu: cpus()[0]?.model.trim(),
			threads: cpus().length,
			ramGB: Math.round(totalmem() / 2 ** 30),
			os: `${platform()} ${release()}`,
			ci: process.env.CI ? hostname() : undefined,
		},
		node: process.version,
		pnpm: quiet("pnpm --version", repo),
		git: {
			sha: quiet("git rev-parse HEAD", repo),
			dirty: Boolean(quiet("git status --porcelain", repo)),
		},
	};
}

/** Installed versions of `names` in the app, read from its node_modules. */
export function installedVersions(app, names) {
	return Object.fromEntries(
		names.map((name) => {
			try {
				const pkg = JSON.parse(
					readFileSync(join(app, "node_modules", name, "package.json"), "utf8"),
				);
				return [name, pkg.version];
			} catch {
				return [name, undefined];
			}
		}),
	);
}
