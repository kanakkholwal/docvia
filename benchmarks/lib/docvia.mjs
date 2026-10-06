import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "./process.mjs";

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
