import { relative } from "node:path";
import type { FrontmatterSchema } from "@docvia/core";
import { collectMacroOptions } from "../index";
import { type AliasOptions, runnerImport } from "vite";

const posix = (p: string) => p.split("\\").join("/");
const BODIES_PREFIX = "virtual:docvia/bodies?collection=";

/** The internal module holding a collection's lazy bodies and `meta.json` files. */
export function bodiesModuleId(collection: string): string {
	return `${BODIES_PREFIX}${encodeURIComponent(collection)}`;
}

/** The collection a bodies module id refers to, if it is one. */
export function bodiesCollection(id: string): string | undefined {
	const raw = id.startsWith("\0") ? id.slice(1) : id;
	return raw.startsWith(BODIES_PREFIX)
		? decodeURIComponent(raw.slice(BODIES_PREFIX.length))
		: undefined;
}

/** A collection's bodies module; a root-relative `base` keeps glob keys relative to its dir. */
export function generateBodiesModule(
	root: string,
	collection: { name: string; dir: string },
): string {
	const base = JSON.stringify(
		`/${posix(relative(root, collection.dir))}`.replace(/^\/\//, "/"),
	);
	const query = JSON.stringify(
		`?docvia&collection=${encodeURIComponent(collection.name)}`,
	);
	return [
		`export const bodies = import.meta.glob("./**/*.md", { base: ${base}, query: ${query} });`,
		`export const metaFiles = import.meta.glob("./**/meta.json", { base: ${base}, eager: true, import: "default" });`,
	].join("\n");
}

/** Evaluate a macro module with Vite (keeping the app's aliases) to read its schemas. */
export function evaluateWithVite(
	file: string,
	root: string,
	alias: AliasOptions | undefined,
): Promise<Map<string, FrontmatterSchema | undefined>> {
	return collectMacroOptions(root, () =>
		runnerImport(file, {
			root,
			configFile: false,
			logLevel: "silent",
			resolve: { alias },
			plugins: [],
		}),
	);
}
