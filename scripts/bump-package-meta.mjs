#!/usr/bin/env node
// One-shot script to normalize package metadata across all packages in the
// monorepo for the v0.1 preview release. Bumps versions, fills repository
// metadata, license, engines, files, and publishConfig.
//
// Usage: node scripts/bump-package-meta.mjs

import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const packagesDir = join(repoRoot, "packages");

const VERSION = "0.1.0";

const descriptions = {
	"@docvia/cli": "Build-time documentation compiler — CLI entry point",
	"@docvia/compiler":
		"Parallel build orchestrator and module-graph generator for docvia",
	"@docvia/core":
		"Markdown parsing pipeline (micromark + unified) for docvia",
	"@docvia/ir":
		"Intermediate representation, error system, and AST → IR transform for docvia",
	"@docvia/plugins":
		"Plugin runner, defineConfig, and config loader for docvia",
	"@docvia/renderer-core":
		"Framework-agnostic rendering engine and default renderers for docvia",
	"@docvia/renderer-react": "React renderer adapter for docvia",
	"@docvia/renderer-svelte": "Svelte renderer adapter for docvia",
	"@docvia/schema":
		"Frontmatter validation (Zod), YAML parsing, and TS codegen for docvia",
	"@docvia/search":
		"Section-level Orama indexing and client search helper for docvia",
	"@docvia/source":
		"Runtime collection helpers and Node markdown loader for docvia",
	"@docvia/plugin-vite": "Vite plugin for docvia (?docvia virtual modules)",
	"@docvia/plugin-next": "Next.js integration for docvia",
};

async function main() {
	const dirs = await readdir(packagesDir, { withFileTypes: true });
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

		pkg.version = VERSION;
		if (!pkg.description && descriptions[pkg.name]) {
			pkg.description = descriptions[pkg.name];
		}
		pkg.license = pkg.license ?? "MIT";
		pkg.engines = { node: ">=20.0.0", ...pkg.engines };
		pkg.repository = pkg.repository ?? {
			type: "git",
			url: "https://github.com/kanakkholwal/docvia.git",
			directory: `packages/${ent.name}`,
		};
		pkg.publishConfig = pkg.publishConfig ?? { access: "public" };

		// Standardize files field
		if (!pkg.files) {
			pkg.files = ["dist", "README.md"];
		}

		// Standardize keywords
		if (!pkg.keywords) {
			pkg.keywords = ["docs", "documentation", "docvia"];
		}

		await writeFile(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf-8");
		console.log(`✓ updated ${pkg.name} → ${VERSION}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
