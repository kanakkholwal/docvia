import fs from "node:fs";
import path from "node:path";

const packagesDir = path.resolve("./packages");
const packages = fs.readdirSync(packagesDir);

for (const pkg of packages) {
	const pkgDir = path.join(packagesDir, pkg);
	if (!fs.statSync(pkgDir).isDirectory()) continue;

	const pkgJsonPath = path.join(pkgDir, "package.json");
	if (!fs.existsSync(pkgJsonPath)) continue;

	let content = fs.readFileSync(pkgJsonPath, "utf-8");

	// Quick regex to add "default": "./dist/index.mjs" (or equivalent)
	// right after "import": "./dist/index.mjs"

	// Example matches:
	// "import": "./dist/index.mjs"
	// "import": "./dist/index.mjs",

	const hasDefault = /"default"\s*:/.test(content);
	if (!hasDefault) {
		content = content.replace(/("import": "[^"]+")(,?)/g, (_match, p1, p2) => {
			// p1 is "import": "./dist/index.mjs"
			// p2 is , or empty
			const defaultExport = p1.replace('"import"', '"default"');
			return `${p1},\n\t\t\t${defaultExport}${p2}`;
		});

		fs.writeFileSync(pkgJsonPath, content, "utf-8");
		console.log("Fixed", pkg);
	}
}
