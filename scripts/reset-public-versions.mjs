#!/usr/bin/env node
// Resets every public (non-private) package in packages/* to 0.0.0 so a
// subsequent `changeset version` run produces a clean first release.
// One-shot helper — not part of the regular release flow.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, "..", "packages");

const dirs = await readdir(packagesDir, { withFileTypes: true });
let count = 0;
for (const ent of dirs) {
	if (!ent.isDirectory()) continue;
	const pkgPath = join(packagesDir, ent.name, "package.json");
	let raw;
	try {
		raw = await readFile(pkgPath, "utf-8");
	} catch {
		continue;
	}
	const pkg = JSON.parse(raw);
	if (pkg.private) continue;
	pkg.version = "0.0.0";
	await writeFile(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf-8");
	console.log(`✓ ${pkg.name} → 0.0.0`);
	count++;
}
console.log(`\nReset ${count} packages.`);
