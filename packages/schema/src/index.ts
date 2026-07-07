import type { FrontmatterData } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { parse as parseYaml } from "yaml";
import { z } from "zod/v3";

// Frontmatter Extraction

export interface ExtractedFrontmatter {
	readonly data: Record<string, unknown>;
	readonly content: string;
	readonly bodyOffset: number;
}

export function extractFrontmatter(raw: string): ExtractedFrontmatter {
	const lines = raw.split(/\r?\n/);

	if (lines[0]?.trim() !== "---") {
		return { data: {}, content: raw, bodyOffset: 1 };
	}

	let closingIndex = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i]?.trim() === "---") {
			closingIndex = i;
			break;
		}
	}

	if (closingIndex === -1) {
		throw new docviaError(
			"SCHEMA_ERROR",
			"Unclosed frontmatter: missing closing ---",
			undefined,
			{ line: 1, column: 1 },
		);
	}

	const yamlLines = lines.slice(1, closingIndex);
	const bodyOffset = closingIndex + 2;
	const content = lines.slice(closingIndex + 1).join("\n");

	if (yamlLines.length === 0 || yamlLines.every((l) => l.trim() === "")) {
		return { data: {}, content, bodyOffset };
	}

	let data: Record<string, unknown>;
	try {
		data = parseYaml(yamlLines.join("\n")) as Record<string, unknown>;
	} catch (err) {
		throw new docviaError(
			"SCHEMA_ERROR",
			`Invalid YAML in frontmatter: ${(err as Error).message}`,
			undefined,
			{ line: 2, column: 1 },
			err as Error,
		);
	}

	if (typeof data !== "object" || data === null) {
		return { data: {}, content, bodyOffset };
	}

	return { data, content, bodyOffset };
}

// Base schema — the built-in frontmatter fields every page shares. Authored in
// Zod because we own it and rely on its defaults; it is never exposed to users
// as a Zod type, only as a Standard Schema contract at the boundary.

export const DocPageSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().default(""),
		slug: z.string().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		order: z.number().optional(),
	})
	.passthrough();

/** Render a Standard Schema issue path as a dotted string (e.g. `author.name`). */
function formatIssuePath(
	path: StandardSchemaV1.Issue["path"],
): string {
	if (!path || path.length === 0) return "(root)";
	return path
		.map((seg) =>
			typeof seg === "object" && seg !== null
				? String((seg as StandardSchemaV1.PathSegment).key)
				: String(seg),
		)
		.join(".");
}

/**
 * Run a Standard Schema synchronously. Frontmatter is validated at build time
 * where async validation has no place, so a schema whose `validate` returns a
 * promise is rejected with a clear error rather than silently awaited.
 */
function standardValidate(
	schema: StandardSchemaV1,
	data: unknown,
	filePath?: string,
):
	| { readonly ok: true; readonly value: Record<string, unknown> }
	| { readonly ok: false; readonly issues: readonly StandardSchemaV1.Issue[] } {
	const result = schema["~standard"].validate(data);
	if (result instanceof Promise) {
		throw new docviaError(
			"SCHEMA_ERROR",
			`Asynchronous frontmatter schemas are not supported (vendor: ${schema["~standard"].vendor}). Provide a schema whose validation runs synchronously.`,
			filePath,
			{ line: 1, column: 1 },
		);
	}
	if (result.issues) {
		return { ok: false, issues: result.issues };
	}
	return { ok: true, value: result.value as Record<string, unknown> };
}

/**
 * Validate raw frontmatter against the built-in base fields plus an optional
 * user-supplied {@link StandardSchemaV1} (Zod, Valibot, ArkType, …). The base
 * schema fills defaults for the known fields; the extension schema is layered
 * on top and its output wins for any overlapping keys. Issues from both are
 * reported together.
 */
export function validateFrontmatter(
	raw: Record<string, unknown>,
	filePath?: string,
	extensionSchema?: StandardSchemaV1,
): FrontmatterData {
	const issues: string[] = [];

	const baseResult = DocPageSchema.safeParse(raw);
	if (!baseResult.success) {
		for (const i of baseResult.error.issues) {
			issues.push(`  - ${i.path.join(".") || "(root)"}: ${i.message}`);
		}
	}

	let extensionData: Record<string, unknown> = {};
	if (extensionSchema) {
		const extResult = standardValidate(extensionSchema, raw, filePath);
		if (extResult.ok) {
			extensionData = extResult.value;
		} else {
			for (const i of extResult.issues) {
				issues.push(`  - ${formatIssuePath(i.path)}: ${i.message}`);
			}
		}
	}

	if (issues.length > 0) {
		throw new docviaError(
			"SCHEMA_ERROR",
			`Frontmatter validation failed:\n${issues.join("\n")}`,
			filePath,
			{ line: 1, column: 1 },
		);
	}

	return {
		...(baseResult.success ? baseResult.data : {}),
		...extensionData,
	} as FrontmatterData;
}

// Frontmatter TypeScript types are derived at build time from the user's schema
// via `import("@docvia/ir").InferFrontmatter<...>` in the generated
// `types.d.ts` — using the schema's compile-time `~standard.types`, with no
// runtime introspection. See @docvia/runtime's `frontmatterTypeExpression`.
