import type { docviaPlugin, FileEntry } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import {
	findOperation,
	type LoadedSpec,
	loadSpec,
	parseBlockMeta,
} from "./spec";
import { renderOperation } from "./transform";

export interface OpenAPIPluginOptions {
	/**
	 * Path to the OpenAPI 3.x spec file. JSON, YAML, and YML extensions are
	 * detected automatically. Resolved relative to the current working
	 * directory.
	 */
	readonly spec: string;
	/**
	 * Optional language tag the plugin will look for in fenced code blocks.
	 * Defaults to `"openapi"`. Use e.g. `"api"` to match ` ```api GET /users `.
	 */
	readonly fenceLang?: string;
	/**
	 * What to do when a block references a path or method that isn't in the
	 * spec. `"throw"` (default) fails the build with a clear error; `"warn"`
	 * leaves the original fenced block in place and logs a console warning.
	 */
	readonly onMissing?: "throw" | "warn";
}

/**
 * Create the `@docvia/plugin-openapi` plugin. Loads the OpenAPI spec lazily on
 * the first `afterParse` invocation so config files can reference it without
 * blocking on disk I/O at import time.
 */
export function openapi(options: OpenAPIPluginOptions): docviaPlugin {
	const fenceLang = options.fenceLang ?? "openapi";
	const onMissing = options.onMissing ?? "throw";

	let cached: Promise<LoadedSpec> | null = null;
	const getSpec = (): Promise<LoadedSpec> => {
		if (!cached) cached = loadSpec(options.spec);
		return cached;
	};
	// Eagerly start loading so the first file doesn't pay the full cost, but
	// don't throw at plugin construction — config evaluation must stay sync.
	let specHashHint = "pending";
	getSpec()
		.then((s) => {
			specHashHint = s.hash;
		})
		.catch(() => {
			specHashHint = "load-error";
		});

	return {
		name: "@docvia/plugin-openapi",
		version: "0.1.0",
		phase: "normal",
		priority: 100,

		cacheKey() {
			return `@docvia/plugin-openapi@${specHashHint}:${fenceLang}`;
		},

		async afterParse(ast: unknown, file: FileEntry): Promise<unknown> {
			const spec = await getSpec();
			transformTree(ast, spec, fenceLang, onMissing, file);
			return ast;
		},
	};
}

interface MdParent {
	children: MdChild[];
}

type MdChild = {
	type: string;
	lang?: string | null;
	meta?: string | null;
	value?: string;
	children?: MdChild[];
};

function isParent(node: unknown): node is MdParent {
	return (
		typeof node === "object" &&
		node !== null &&
		Array.isArray((node as MdParent).children)
	);
}

/**
 * Walk the mdast tree in-place, replacing any `code` node whose `lang`
 * matches the configured fence language with the rendered operation nodes.
 */
function transformTree(
	root: unknown,
	spec: LoadedSpec,
	fenceLang: string,
	onMissing: "throw" | "warn",
	file: FileEntry,
): void {
	if (!isParent(root)) return;
	const stack: MdParent[] = [root];
	while (stack.length) {
		const parent = stack.pop();
		if (!parent) continue;
		const children = parent.children;
		for (let i = 0; i < children.length; i++) {
			const node = children[i];
			if (!node) continue;
			if (node.type === "code" && node.lang === fenceLang) {
				const replacement = transformBlock(node, spec, onMissing, file);
				if (replacement) {
					children.splice(i, 1, ...replacement);
					i += replacement.length - 1;
				}
			} else if (isParent(node)) {
				stack.push(node as MdParent);
			}
		}
	}
}

function transformBlock(
	node: MdChild,
	spec: LoadedSpec,
	onMissing: "throw" | "warn",
	file: FileEntry,
): MdChild[] | null {
	const parsed = parseBlockMeta(node.meta);
	if (!parsed) {
		const message = `@docvia/plugin-openapi: block in ${file.relativePath} is missing a "METHOD /path" header (got meta=${JSON.stringify(node.meta)})`;
		if (onMissing === "throw") {
			throw new docviaError("PLUGIN_ERROR", message, file.path);
		}
		console.warn(message);
		return null;
	}

	const op = findOperation(spec.doc, parsed.method, parsed.path);
	if (!op) {
		const message = `@docvia/plugin-openapi: no operation ${parsed.method.toUpperCase()} ${parsed.path} in ${spec.path}`;
		if (onMissing === "throw") {
			throw new docviaError("PLUGIN_ERROR", message, file.path);
		}
		console.warn(message);
		return null;
	}

	return renderOperation(spec.doc, parsed.method, parsed.path, op) as MdChild[];
}
