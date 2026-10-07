import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, runCapture } from "./process.mjs";

const posix = (p) => p.split("\\").join("/");

/**
 * Builds and packs this repo's packages, so docvia stacks install exactly what would be
 * published. Returns the CLI to run and the tarball dir for `DOCVIA_TARBALLS`.
 */
export async function packDocvia({ repo, work, log, skipBuild }) {
	const tarballs = join(work, "tarballs");
	mkdirSync(tarballs, { recursive: true });
	if (!skipBuild) await run("pnpm build:packages", { cwd: repo, log });
	await run(
		`pnpm -r --filter "./packages/*" pack --pack-destination "${posix(tarballs)}"`,
		{ cwd: repo, log },
	);
	return { cli: join(repo, "packages", "cli", "bin.mjs"), tarballs };
}

/**
 * Adds docs to a fresh app with the packed CLI, exactly as a developer would. Returns its total
 * time plus the install time and file count `docvia init` reports.
 */
export async function addDocs(app, docvia, log) {
	const { ms, output } = await runCapture(`node "${docvia.cli}" init --yes`, {
		cwd: app,
		env: { DOCVIA_TARBALLS: docvia.tarballs },
		log,
	});
	const install = /Installed with \w+ in ([\d.]+)(ms|s)\b/.exec(output);
	return {
		initMs: ms,
		initInstallMs: install
			? Number(install[1]) * (install[2] === "s" ? 1000 : 1)
			: undefined,
		initFiles: output.split("\n").filter((line) => /^\W*\+ /.test(line)).length,
	};
}
