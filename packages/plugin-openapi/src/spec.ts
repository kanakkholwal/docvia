import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { docviaError } from "@docvia/ir";
import yaml from "js-yaml";
import {
	HTTP_METHODS,
	type HttpMethod,
	type OpenAPIDocument,
	type OpenAPIOperation,
	type OpenAPISchema,
} from "./types";

export interface LoadedSpec {
	readonly path: string;
	readonly hash: string;
	readonly doc: OpenAPIDocument;
}

/**
 * Load an OpenAPI 3.x document from disk. Supports `.json`, `.yaml`, and
 * `.yml` extensions. Returns the parsed document along with a content hash
 * suitable for plugin cache invalidation.
 */
export async function loadSpec(specPath: string): Promise<LoadedSpec> {
	const absolute = resolve(specPath);
	let raw: string;
	try {
		raw = await readFile(absolute, "utf8");
	} catch (err) {
		throw new docviaError(
			"CONFIG_ERROR",
			`@docvia/plugin-openapi: failed to read spec at ${absolute}\n  ${(err as Error).message}`,
			absolute,
			undefined,
			err as Error,
		);
	}

	const ext = extname(absolute).toLowerCase();
	let parsed: unknown;
	try {
		parsed = ext === ".json" ? JSON.parse(raw) : yaml.load(raw);
	} catch (err) {
		throw new docviaError(
			"CONFIG_ERROR",
			`@docvia/plugin-openapi: failed to parse ${ext === ".json" ? "JSON" : "YAML"} spec at ${absolute}\n  ${(err as Error).message}`,
			absolute,
			undefined,
			err as Error,
		);
	}

	if (!parsed || typeof parsed !== "object") {
		throw new docviaError(
			"CONFIG_ERROR",
			`@docvia/plugin-openapi: spec at ${absolute} did not produce an object`,
			absolute,
		);
	}

	const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
	return { path: absolute, hash, doc: parsed as OpenAPIDocument };
}

/**
 * Look up an operation by HTTP method and path. Returns `undefined` when the
 * path or method doesn't exist in the spec so the caller can emit a clear
 * error pointing at the source location.
 */
export function findOperation(
	doc: OpenAPIDocument,
	method: HttpMethod,
	path: string,
): OpenAPIOperation | undefined {
	const item = doc.paths?.[path];
	if (!item) return undefined;
	return item[method];
}

/**
 * Resolve a $ref string against the spec. Only handles internal refs
 * (`#/components/schemas/...`). Returns `undefined` for external or
 * unresolvable refs — callers should fall back to the unresolved ref.
 */
export function resolveRef(
	doc: OpenAPIDocument,
	ref: string,
): OpenAPISchema | undefined {
	if (!ref.startsWith("#/")) return undefined;
	const segments = ref
		.slice(2)
		.split("/")
		.map((seg) => seg.replace(/~1/g, "/").replace(/~0/g, "~"));
	let cursor: unknown = doc;
	for (const seg of segments) {
		if (!cursor || typeof cursor !== "object") return undefined;
		cursor = (cursor as Record<string, unknown>)[seg];
	}
	return cursor as OpenAPISchema | undefined;
}

/**
 * Parse the meta string of an openapi fenced block, e.g. "GET /api/users" or
 * "post /users/{id}". Returns null when the format isn't recognised.
 */
export function parseBlockMeta(
	meta: string | null | undefined,
): { method: HttpMethod; path: string } | null {
	if (!meta) return null;
	const trimmed = meta.trim();
	const m = trimmed.match(/^([a-zA-Z]+)\s+(\S+)/);
	if (!m?.[1] || !m[2]) return null;
	const method = m[1].toLowerCase() as HttpMethod;
	if (!HTTP_METHODS.includes(method)) return null;
	return { method, path: m[2] };
}
