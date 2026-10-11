import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { docviaConfig, FrontmatterSchema } from "@docvia/core";
import { docviaError } from "@docvia/core";
import { resolveComponents } from "./emit";
import { relativeInside } from "./paths";

export interface ResolvedCollection {
	readonly name: string;
	/** Absolute source directory. */
	readonly dir: string;
	readonly baseUrl: string;
	readonly frontmatter?: FrontmatterSchema;
	/** True when the collection declares its own schema (affects generated types). */
	readonly ownSchema: boolean;
	readonly optional: boolean;
	/** Declared in code by `defineDocs()`: typed from the user's file, not `.docvia/`. */
	readonly macro?: boolean;
}

/** `config.collections` (or one `docs` collection over `sourceDir`), validated and made absolute. */
export function resolveCollections(
	config: docviaConfig,
	projectRoot: string,
): ResolvedCollection[] {
	// The implicit collection is optional: apps on `defineDocs()` declare theirs in code.
	const collections = config.collections ?? [
		{ name: "docs", sourceDir: config.sourceDir, baseUrl: "/", optional: true },
	];
	return collections.map((c) => {
		if (!/^[A-Za-z_$][\w$]*$/.test(c.name)) {
			throw new docviaError(
				"CONFIG_ERROR",
				`Collection name "${c.name}" must be a valid JS identifier: it becomes an export name.`,
			);
		}
		return {
			name: c.name,
			dir: resolve(projectRoot, c.sourceDir),
			baseUrl: (c.baseUrl ?? `/${c.name === "docs" ? "" : c.name}`).replace(
				/\/+/g,
				"/",
			),
			frontmatter: c.frontmatter ?? config.frontmatter,
			ownSchema: c.frontmatter !== undefined,
			optional: c.optional === true,
		};
	});
}

/** The collection owning `absPath` and the file's posix path inside it. */
export function locate(
	collections: readonly ResolvedCollection[],
	absPath: string,
): { collection: ResolvedCollection; relativePath: string } | undefined {
	for (const collection of collections) {
		const relativePath = relativeInside(collection.dir, absPath);
		if (relativePath) return { collection, relativePath };
	}
	return undefined;
}

/** Throw a clear error for a required collection whose directory is missing. */
export function assertCollectionDirs(
	collections: readonly ResolvedCollection[],
): void {
	for (const c of collections) {
		if (!c.optional && !existsSync(c.dir)) {
			throw new docviaError(
				"CONFIG_ERROR",
				`Collection "${c.name}": sourceDir not found at ${c.dir}. Set \`optional: true\` if it may be absent.`,
			);
		}
	}
}

// Component paths may omit the extension; the host bundler resolves it.
const COMPONENT_EXTENSIONS = [".svelte", ".tsx", ".ts", ".jsx", ".js", ".vue"];

function componentExists(absPath: string): boolean {
	return (
		existsSync(absPath) ||
		COMPONENT_EXTENSIONS.some(
			(ext) =>
				existsSync(absPath + ext) || existsSync(join(absPath, `index${ext}`)),
		)
	);
}

/** Throw a `CONFIG_ERROR` for any registered component whose file is missing. */
export function assertComponentsExist(
	config: docviaConfig,
	projectRoot: string,
): void {
	for (const c of resolveComponents(config, projectRoot)) {
		if (!componentExists(c.absPath)) {
			throw new docviaError(
				"CONFIG_ERROR",
				`Component "${c.name}" not found at ${c.absPath}. Component paths resolve from the project root (${projectRoot}).`,
			);
		}
	}
}
