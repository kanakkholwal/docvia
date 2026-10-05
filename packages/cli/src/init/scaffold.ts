import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { importSpecifier, type Project } from "./detect";

export interface PlannedFile {
	/** Absolute destination path. */
	readonly path: string;
	readonly content: string;
	readonly exists: boolean;
}

// `dist/index.js` sits one level below the package root; `src/init/scaffold.ts` two.
const TEMPLATES = ["../templates/", "../../templates/"]
	.map((p) => fileURLToPath(new URL(p, import.meta.url)))
	.find((dir) => existsSync(join(dir, "content"))) as string;

function listFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? listFiles(path) : [path];
	});
}

/** Template placeholders: `"~lib/source"` and `"~components/x"` become project imports. */
const PLACEHOLDER = /(["'])~(lib|components)\/([\w-]+)\1/g;

function resolvePlaceholders(
	project: Project,
	dest: string,
	text: string,
): string {
	return text.replace(
		PLACEHOLDER,
		(_, quote: string, kind: string, name: string) => {
			const target = join(project.root, project.srcDir, kind, name);
			const spec = importSpecifier(
				project,
				dest,
				target,
				kind === "lib" ? ".ts" : ".tsx",
			);
			return `${quote}${spec}${quote}`;
		},
	);
}

const STANDALONE_CONFIG = `import { defineConfig } from "@docvia/cli";

export default defineConfig({ sourceDir: "content/docs" });
`;

/** Every file `docvia init` writes for this project, nothing touched yet. */
export function planFiles(project: Project): PlannedFile[] {
	const { root, framework, srcDir, routesDir } = project;
	const entries: Array<[from: string, to: string]> = [];
	const copyTree = (from: string, to: string) => {
		for (const file of listFiles(join(TEMPLATES, from))) {
			entries.push([
				file,
				join(root, to, relative(join(TEMPLATES, from), file)),
			]);
		}
	};

	copyTree("content", "content");
	if (framework !== "standalone") {
		copyTree("shared/lib", join(srcDir, "lib"));
	}
	if (framework === "next" || framework === "tanstack-start") {
		copyTree("react/components", join(srcDir, "components"));
	}
	if (framework === "next") {
		copyTree("next/app", routesDir);
		entries.push([
			join(TEMPLATES, "docs.css"),
			join(root, routesDir, "docs", "docs.css"),
		]);
	} else if (framework === "tanstack-start") {
		copyTree("tanstack-start/src/routes", routesDir);
		entries.push([
			join(TEMPLATES, "docs.css"),
			join(root, routesDir, "docs", "-docs.css"),
		]);
	} else if (framework === "sveltekit") {
		copyTree("sveltekit/src/routes", routesDir);
		entries.push([
			join(TEMPLATES, "docs.css"),
			join(root, routesDir, "docs", "docs.css"),
		]);
	}

	const files = entries.map(([from, path]) => ({
		path,
		content: resolvePlaceholders(project, path, readFileSync(from, "utf8")),
		exists: existsSync(path),
	}));
	if (framework === "standalone") {
		const path = join(root, "docvia.config.ts");
		files.push({ path, content: STANDALONE_CONFIG, exists: existsSync(path) });
	}
	return files;
}
