import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import type { docviaConfig, FrontmatterSchema } from "@docvia/core";
import MagicString from "magic-string";
import { parseSync } from "oxc-parser";
import { globSync } from "tinyglobby";
import { resolveComponents } from "./emit";

/** The macro entry apps import, and the runtime its compiled calls use. */
export const MACRO_SOURCE = "@docvia/core/source/macro";
const MACRO_RUNTIME = "@docvia/core/source/macro-runtime";

interface Node {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

export interface MacroCollection {
	/** Internal collection name, unique per directory. */
	readonly name: string;
	readonly dir: string;
	/** From `docs.schema`, when the host evaluated the module to read it. */
	readonly frontmatter?: FrontmatterSchema;
}

export interface MacroTransformContext {
	readonly root: string;
	readonly config: docviaConfig;
	/** Register the collection; returns its frontmatter keyed by path relative to `dir`. */
	readonly index: (
		collection: MacroCollection,
	) => Promise<Record<string, unknown>>;
	/** Evaluate the module to read non-literal options; called only when a schema is present. */
	readonly evaluate?: () => Promise<Map<string, FrontmatterSchema | undefined>>;
	/**
	 * `glob`: bodies come from `bodiesModule(name)` (a Vite module using `import.meta.glob`).
	 * `explicit`: one lazy `import()` per page, for bundlers without `import.meta.glob`.
	 */
	readonly emit:
		| {
				readonly kind: "glob";
				readonly bodiesModule: (collection: string) => string;
		  }
		| { readonly kind: "explicit" };
}

export interface MacroTransformResult {
	readonly code: string;
	readonly map: ReturnType<MagicString["generateMap"]>;
	/** Collections the module declares; their pages and folders are its dependencies. */
	readonly collections: readonly MacroCollection[];
}

const posix = (p: string) => p.split("\\").join("/");

/** Collection name for a directory: stable, readable, URL-safe once encoded. */
export function macroCollectionName(root: string, dir: string): string {
	return `macro:${posix(relative(root, dir)) || "."}`;
}

/** The directory a macro collection name refers to. */
export function macroCollectionDir(
	root: string,
	name: string,
): string | undefined {
	return name.startsWith("macro:")
		? resolve(root, name.slice("macro:".length))
		: undefined;
}

/** Files named in `names` under `root` that import `@docvia/core/source/macro`. */
export function findMacroModules(
	root: string,
	names: readonly string[],
): string[] {
	const files = globSync(
		names.map((n) => `**/${n}`),
		{ cwd: root, absolute: true, ignore: ["**/node_modules/**", "**/.*/**"] },
	);
	return files.filter((f) => readFileSync(f, "utf8").includes(MACRO_SOURCE));
}

function walk(node: unknown, visit: (n: Node) => void): void {
	if (!node || typeof node !== "object") return;
	if (Array.isArray(node)) {
		for (const child of node) walk(child, visit);
		return;
	}
	const n = node as Node;
	if (typeof n.type === "string") visit(n);
	for (const key of Object.keys(n)) {
		if (key !== "type" && key !== "start" && key !== "end") walk(n[key], visit);
	}
}

/** Strip `as const` / `satisfies` / parentheses around an expression. */
function unwrap(node: Node | undefined): Node | undefined {
	let n = node;
	while (
		n &&
		/^(TSAsExpression|TSSatisfiesExpression|ParenthesizedExpression)$/.test(
			n.type,
		)
	) {
		n = n.expression as Node;
	}
	return n;
}

function property(node: Node | undefined, key: string): Node | undefined {
	const obj = unwrap(node);
	if (obj?.type !== "ObjectExpression") return undefined;
	const prop = (obj.properties as Node[]).find(
		(p) =>
			p.type === "Property" &&
			((p.key as Node).name === key || (p.key as Node).value === key),
	);
	return prop ? unwrap(prop.value as Node) : undefined;
}

function literalDir(options: Node | undefined): string {
	const value = property(options, "dir");
	if (!value) return "content/docs";
	if (value.type === "Literal" && typeof value.value === "string")
		return value.value;
	throw new Error("[docvia] defineDocs(): `dir` must be a string literal.");
}

function relativeSpecifier(fromDir: string, file: string): string {
	const rel = posix(relative(fromDir, file));
	return rel.startsWith(".") ? rel : `./${rel}`;
}

/**
 * Rewrite `defineDocs()` / `defineRegistry()` calls imported from `@docvia/core/source/macro` into
 * runtime calls carrying the folder's frontmatter inline and lazy page bodies. Null when the
 * module has none.
 */
export async function transformMacroModule(
	code: string,
	id: string,
	ctx: MacroTransformContext,
): Promise<MacroTransformResult | null> {
	if (!code.includes(MACRO_SOURCE)) return null;
	const file = id.split("?")[0] ?? id;
	const { program } = parseSync(file, code);
	const ast = program as unknown as Node;

	const locals = new Map<string, "defineDocs" | "defineRegistry">();
	for (const statement of ast.body as Node[]) {
		if (statement.type !== "ImportDeclaration") continue;
		if ((statement.source as Node).value !== MACRO_SOURCE) continue;
		for (const spec of statement.specifiers as Node[]) {
			const imported = (spec.imported as Node | undefined)?.name;
			if (imported === "defineDocs" || imported === "defineRegistry") {
				locals.set((spec.local as Node).name as string, imported);
			}
		}
	}
	if (locals.size === 0) return null;

	const calls: Node[] = [];
	walk(ast, (n) => {
		if (
			n.type === "CallExpression" &&
			locals.has((n.callee as Node).name as string)
		) {
			calls.push(n);
		}
	});
	if (calls.length === 0) return null;

	const needsSchemas = calls.some((c) =>
		property(property((c.arguments as Node[])[0], "docs"), "schema"),
	);
	const schemas = needsSchemas ? await ctx.evaluate?.() : undefined;

	const s = new MagicString(code);
	const hoisted = [
		`import * as __docvia_macro from ${JSON.stringify(MACRO_RUNTIME)};`,
	];
	const collections: MacroCollection[] = [];
	const fromDir = dirname(file);

	for (const call of calls) {
		const options = (call.arguments as Node[])[0];
		if (locals.get((call.callee as Node).name as string) === "defineRegistry") {
			const entries = resolveComponents(ctx.config, ctx.root).map((c, i) => {
				hoisted.push(
					`import __docvia_c${i} from ${JSON.stringify(relativeSpecifier(fromDir, c.absPath))};`,
				);
				const hydrate =
					c.entry.hydrate !== undefined ? `, hydrate: ${c.entry.hydrate}` : "";
				const props = c.entry.defaultProps
					? `, defaultProps: ${JSON.stringify(c.entry.defaultProps)}`
					: "";
				return `${JSON.stringify(c.name)}: { component: __docvia_c${i}${hydrate}${props} }`;
			});
			s.overwrite(
				call.start,
				call.end,
				`__docvia_macro.registry({ ${entries.join(", ")} })`,
			);
			continue;
		}

		const dir = resolve(ctx.root, literalDir(options));
		const collection: MacroCollection = {
			name: macroCollectionName(ctx.root, dir),
			dir,
			frontmatter: schemas?.get(dir),
		};
		collections.push(collection);
		const meta = await ctx.index(collection);
		const i = collections.length - 1;

		let bodies: string;
		let metaFiles: string;
		if (ctx.emit.kind === "glob") {
			// A separate module: frontmatter edits re-analyse this file, not one import per page.
			hoisted.push(
				`import * as __docvia_files${i} from ${JSON.stringify(ctx.emit.bodiesModule(collection.name))};`,
			);
			bodies = `__docvia_files${i}.bodies`;
			metaFiles = `__docvia_files${i}.metaFiles`;
		} else {
			const query = `?docvia&collection=${encodeURIComponent(collection.name)}`;
			bodies = `{ ${Object.keys(meta)
				.map(
					(rel) =>
						`${JSON.stringify(`./${rel}`)}: () => import(${JSON.stringify(relativeSpecifier(fromDir, resolve(dir, rel)) + query)})`,
				)
				.join(", ")} }`;
			const metaPaths = globSync("**/meta.json", { cwd: dir });
			metaFiles = `{ ${metaPaths
				.map((rel, j) => {
					hoisted.push(
						`import __docvia_meta${i}_${j} from ${JSON.stringify(relativeSpecifier(fromDir, resolve(dir, rel)))};`,
					);
					return `${JSON.stringify(`./${rel}`)}: __docvia_meta${i}_${j}`;
				})
				.join(", ")} }`;
		}
		const optionsSource = options
			? code.slice(options.start, options.end)
			: "undefined";
		s.overwrite(
			call.start,
			call.end,
			`__docvia_macro.docs(${optionsSource}, { meta: ${JSON.stringify(meta)}, bodies: ${bodies}, metaFiles: ${metaFiles} })`,
		);
	}
	s.prepend(`${hoisted.join("\n")}\n`);
	return {
		code: s.toString(),
		map: s.generateMap({ hires: "boundary", source: id }),
		collections,
	};
}

const COLLECT = Symbol.for("docvia.macro.collect");
let evaluating: Promise<unknown> = Promise.resolve();

/**
 * Run `load()` with `defineDocs()` recording its options instead of throwing, to read values
 * that aren't literals (schemas). fumadocs calls this "config mode". Serialised per process.
 */
export function collectMacroOptions(
	root: string,
	load: () => Promise<unknown>,
): Promise<Map<string, FrontmatterSchema | undefined>> {
	const run = evaluating.then(async () => {
		const schemas = new Map<string, FrontmatterSchema | undefined>();
		const global = globalThis as Record<symbol, unknown>;
		global[COLLECT] = (
			fn: string,
			options?: { dir?: string; docs?: { schema?: FrontmatterSchema } },
		) => {
			if (fn !== "defineDocs") return;
			schemas.set(
				resolve(root, options?.dir ?? "content/docs"),
				options?.docs?.schema,
			);
		};
		try {
			await load();
		} finally {
			delete global[COLLECT];
		}
		return schemas;
	});
	evaluating = run.catch(() => {});
	return run;
}
