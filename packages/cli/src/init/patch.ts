import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import MagicString from "magic-string";
import { parseSync } from "oxc-parser";

export interface PatchResult {
	readonly file: string;
	/** New file contents, or `undefined` when the file already uses docvia. */
	readonly code?: string;
}

interface Node {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

const VITE_CONFIGS = [
	"vite.config.ts",
	"vite.config.mts",
	"vite.config.js",
	"vite.config.mjs",
];
const NEXT_CONFIGS = [
	"next.config.ts",
	"next.config.mts",
	"next.config.mjs",
	"next.config.js",
];

export function findConfig(
	root: string,
	framework: "vite" | "next",
): string | undefined {
	const names = framework === "vite" ? VITE_CONFIGS : NEXT_CONFIGS;
	return names.map((n) => join(root, n)).find((f) => existsSync(f));
}

function walk(node: unknown, visit: (n: Node) => boolean | undefined): boolean {
	if (!node || typeof node !== "object") return false;
	if (Array.isArray(node)) return node.some((child) => walk(child, visit));
	const n = node as Node;
	if (typeof n.type === "string" && visit(n)) return true;
	return Object.values(n).some((child) => walk(child, visit));
}

function insertImport(s: MagicString, program: Node, line: string): void {
	const body = program.body as Node[];
	const imports = body.filter((n) => n.type === "ImportDeclaration");
	const last = imports.at(-1);
	// Match the file's quote and semicolon style.
	const sample = last ? s.original.slice(last.start, last.end) : "";
	if (sample.includes("'")) line = line.replaceAll('"', "'");
	if (last && !sample.endsWith(";")) line = line.replace(/;$/, "");
	if (last) s.appendLeft(last.end, `\n${line}`);
	else s.prepend(`${line}\n`);
}

/** Adds `docvia()` as the first Vite plugin. */
export function patchViteConfig(file: string): PatchResult {
	const code = readFileSync(file, "utf8");
	if (code.includes("@docvia/plugin-vite")) return { file };
	const { program } = parseSync(file, code) as unknown as { program: Node };
	let plugins: Node | undefined;
	walk(program, (n) => {
		if (n.type !== "Property" && n.type !== "ObjectProperty") return false;
		const key = n.key as Node & { name?: string; value?: string };
		const value = n.value as Node;
		if (
			(key.name ?? key.value) === "plugins" &&
			value.type === "ArrayExpression"
		) {
			plugins = value;
			return true;
		}
		return false;
	});
	if (!plugins) {
		throw new Error(`no \`plugins: [...]\` array found in ${file}`);
	}
	const s = new MagicString(code);
	const elements = plugins.elements as Node[];
	const first = elements[0];
	if (first) {
		const indent = /[ \t]*$/.exec(code.slice(0, first.start))?.[0] ?? "";
		const ownLine =
			code
				.slice(code.lastIndexOf("\n", first.start) + 1, first.start)
				.trim() === "";
		s.prependLeft(first.start, ownLine ? `docvia(),\n${indent}` : "docvia(), ");
	} else {
		s.appendLeft(plugins.start + 1, "docvia()");
	}
	insertImport(s, program, 'import { docvia } from "@docvia/plugin-vite";');
	return { file, code: s.toString() };
}

/** Wraps the exported Next config in `withDocvia()`. */
export function patchNextConfig(file: string): PatchResult {
	const code = readFileSync(file, "utf8");
	if (code.includes("@docvia/plugin-next")) return { file };
	const { program } = parseSync(file, code) as unknown as { program: Node };
	const s = new MagicString(code);
	const body = program.body as Node[];
	const esm = body.find((n) => n.type === "ExportDefaultDeclaration");
	if (esm) {
		const decl = esm.declaration as Node;
		s.prependLeft(decl.start, "withDocvia()(");
		s.appendRight(decl.end, ")");
		insertImport(
			s,
			program,
			'import { withDocvia } from "@docvia/plugin-next";',
		);
		return { file, code: s.toString() };
	}
	let cjs: Node | undefined;
	walk(program, (n) => {
		if (n.type !== "AssignmentExpression") return false;
		const left = n.left as Node & {
			object?: { name?: string };
			property?: { name?: string };
		};
		if (left.object?.name === "module" && left.property?.name === "exports") {
			cjs = n.right as Node;
			return true;
		}
		return false;
	});
	if (!cjs) throw new Error(`no default export found in ${file}`);
	s.prependLeft(cjs.start, "withDocvia()(");
	s.appendRight(cjs.end, ")");
	s.prepend('const { withDocvia } = require("@docvia/plugin-next");\n');
	return { file, code: s.toString() };
}

const TAILWIND_IMPORT = /^@import\s+["']tailwindcss["'][^;\n]*;?[ \t]*$/m;

/** The app's Tailwind v4 entry stylesheet, if it has one. */
export function findTailwindCss(
	root: string,
	dirs: readonly string[],
): string | undefined {
	for (const dir of dirs) {
		const abs = join(root, dir);
		if (!existsSync(abs)) continue;
		for (const name of readdirSync(abs)) {
			if (!name.endsWith(".css")) continue;
			const file = join(abs, name);
			if (TAILWIND_IMPORT.test(readFileSync(file, "utf8"))) return file;
		}
	}
	return undefined;
}

/**
 * Stops Tailwind v4 scanning the docs: otherwise every Markdown edit rebuilds the app's CSS
 * (about 9 s per edit through Next.js PostCSS) and words in the docs become utility classes.
 */
export function patchTailwindCss(
	file: string,
	contentDir: string,
): PatchResult {
	const code = readFileSync(file, "utf8");
	if (code.includes("@source not")) return { file };
	const target = relative(dirname(file), contentDir).split("\\").join("/");
	const quote = /@import\s+'/.test(code) ? "'" : '"';
	const line = `@source not ${quote}${target}${quote};`;
	return {
		file,
		code: code.replace(TAILWIND_IMPORT, (m) => `${m}\n${line}`),
	};
}
