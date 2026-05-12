import { resolveRef } from "./spec";
import type {
    OpenAPIDocument,
    OpenAPIMediaType,
    OpenAPIOperation,
    OpenAPIParameter,
    OpenAPISchema,
} from "./types";

// Minimal mdast node shapes — kept structural so we don't depend on @types/mdast.
// Anything we don't write doesn't need to be modeled.

type MdNode =
	| {
			type: "heading";
			depth: 1 | 2 | 3 | 4 | 5 | 6;
			children: MdInline[];
	  }
	| { type: "paragraph"; children: MdInline[] }
	| { type: "code"; lang?: string | null; meta?: string | null; value: string }
	| { type: "blockquote"; children: MdNode[] }
	| { type: "list"; ordered: boolean; children: MdListItem[] }
	| MdTable
	| { type: "thematicBreak" };

type MdInline =
	| { type: "text"; value: string }
	| { type: "inlineCode"; value: string }
	| { type: "strong"; children: MdInline[] }
	| { type: "emphasis"; children: MdInline[] }
	| { type: "link"; url: string; children: MdInline[] };

type MdListItem = { type: "listItem"; children: MdNode[] };

type MdTable = {
	type: "table";
	align?: ReadonlyArray<"left" | "right" | "center" | null>;
	children: MdTableRow[];
};

type MdTableRow = {
	type: "tableRow";
	children: MdTableCell[];
};

type MdTableCell = {
	type: "tableCell";
	children: MdInline[];
};

const text = (value: string): MdInline => ({ type: "text", value });
const code = (value: string): MdInline => ({ type: "inlineCode", value });
const strong = (children: MdInline[]): MdInline => ({
	type: "strong",
	children,
});
const cell = (children: MdInline[]): MdTableCell => ({
	type: "tableCell",
	children,
});

/**
 * Render an OpenAPI operation as a sequence of mdast block nodes. The output
 * is intentionally plain mdast — the rest of the docvia pipeline will turn it
 * into IR, framework-native modules, and rendered output the same way as any
 * hand-written Markdown would.
 */
export function renderOperation(
	doc: OpenAPIDocument,
	method: string,
	path: string,
	op: OpenAPIOperation,
): MdNode[] {
	const out: MdNode[] = [];

	// Heading: METHOD /path
	out.push({
		type: "heading",
		depth: 3,
		children: [
			strong([text(method.toUpperCase())]),
			text("  "),
			code(path),
		],
	});

	// Summary / description
	if (op.summary) {
		out.push({
			type: "paragraph",
			children: [strong([text(op.summary)])],
		});
	}
	if (op.description) {
		out.push({
			type: "paragraph",
			children: [text(op.description)],
		});
	}
	if (op.deprecated) {
		out.push({
			type: "blockquote",
			children: [
				{
					type: "paragraph",
					children: [
						strong([text("Deprecated.")]),
						text(" This endpoint will be removed in a future version."),
					],
				},
			],
		});
	}

	// Parameters
	const params = op.parameters ?? [];
	if (params.length > 0) {
		out.push({
			type: "heading",
			depth: 4,
			children: [text("Parameters")],
		});
		out.push(renderParameterTable(doc, params));
	}

	// Request body
	if (op.requestBody?.content) {
		out.push({
			type: "heading",
			depth: 4,
			children: [text("Request body")],
		});
		if (op.requestBody.description) {
			out.push({
				type: "paragraph",
				children: [text(op.requestBody.description)],
			});
		}
		for (const node of renderMediaTypes(doc, op.requestBody.content)) {
			out.push(node);
		}
	}

	// Responses
	if (op.responses) {
		out.push({
			type: "heading",
			depth: 4,
			children: [text("Responses")],
		});
		const statuses = Object.keys(op.responses).sort();
		for (const status of statuses) {
			const response = op.responses[status];
			if (!response) continue;
			out.push({
				type: "paragraph",
				children: [
					strong([text(status)]),
					text("  "),
					text(response.description ?? ""),
				],
			});
			if (response.content) {
				for (const node of renderMediaTypes(doc, response.content)) {
					out.push(node);
				}
			}
		}
	}

	out.push({ type: "thematicBreak" });
	return out;
}

function renderParameterTable(
	doc: OpenAPIDocument,
	params: readonly OpenAPIParameter[],
): MdTable {
	const header: MdTableRow = {
		type: "tableRow",
		children: [
			cell([strong([text("Name")])]),
			cell([strong([text("In")])]),
			cell([strong([text("Type")])]),
			cell([strong([text("Required")])]),
			cell([strong([text("Description")])]),
		],
	};

	const rows: MdTableRow[] = params.map((p) => {
		const schema = resolveSchema(doc, p.schema);
		return {
			type: "tableRow",
			children: [
				cell([code(p.name)]),
				cell([text(p.in)]),
				cell([code(formatSchemaType(schema))]),
				cell([text(p.required ? "yes" : "no")]),
				cell([text(p.description ?? "")]),
			],
		};
	});

	return {
		type: "table",
		align: ["left", "left", "left", "left", "left"],
		children: [header, ...rows],
	};
}

function renderMediaTypes(
	doc: OpenAPIDocument,
	content: Readonly<Record<string, OpenAPIMediaType>>,
): MdNode[] {
	const nodes: MdNode[] = [];
	for (const [mediaType, media] of Object.entries(content)) {
		const lang = inferLang(mediaType);
		const example = pickExample(media);
		const sample =
			example !== undefined
				? formatExample(example, lang)
				: renderSchemaExample(doc, media.schema, lang);
		nodes.push({
			type: "paragraph",
			children: [code(mediaType)],
		});
		nodes.push({
			type: "code",
			lang,
			value: sample,
		});
	}
	return nodes;
}

function pickExample(media: OpenAPIMediaType): unknown {
	if (media.example !== undefined) return media.example;
	if (media.examples) {
		const first = Object.values(media.examples)[0];
		if (first && "value" in first) return first.value;
	}
	return undefined;
}

function renderSchemaExample(
	doc: OpenAPIDocument,
	schema: OpenAPISchema | undefined,
	lang: string,
): string {
	const resolved = resolveSchema(doc, schema);
	if (!resolved) return lang === "json" ? "{}" : "";
	if (resolved.example !== undefined) {
		return formatExample(resolved.example, lang);
	}
	// Synthesize a tiny example from the schema shape.
	const example = synthesizeExample(doc, resolved, new Set());
	return formatExample(example, lang);
}

function synthesizeExample(
	doc: OpenAPIDocument,
	schema: OpenAPISchema,
	seen: Set<string>,
): unknown {
	const resolved = resolveSchema(doc, schema);
	if (!resolved) return null;
	if (resolved.$ref) {
		if (seen.has(resolved.$ref)) return null;
		seen.add(resolved.$ref);
	}
	if (resolved.example !== undefined) return resolved.example;
	if (resolved.enum && resolved.enum.length > 0) return resolved.enum[0];
	switch (resolved.type) {
		case "string":
			return resolved.format === "date-time"
				? new Date().toISOString()
				: resolved.format === "uuid"
					? "00000000-0000-0000-0000-000000000000"
					: "string";
		case "integer":
		case "number":
			return 0;
		case "boolean":
			return true;
		case "array":
			return resolved.items
				? [synthesizeExample(doc, resolved.items, seen)]
				: [];
		case "object": {
			const obj: Record<string, unknown> = {};
			if (resolved.properties) {
				for (const [k, v] of Object.entries(resolved.properties)) {
					obj[k] = synthesizeExample(doc, v, seen);
				}
			}
			return obj;
		}
		default:
			return null;
	}
}

function resolveSchema(
	doc: OpenAPIDocument,
	schema: OpenAPISchema | undefined,
): OpenAPISchema | undefined {
	if (!schema) return undefined;
	if (schema.$ref) {
		const resolved = resolveRef(doc, schema.$ref);
		return resolved ?? schema;
	}
	return schema;
}

function formatSchemaType(schema: OpenAPISchema | undefined): string {
	if (!schema) return "any";
	if (schema.$ref) {
		const last = schema.$ref.split("/").pop() ?? "ref";
		return last;
	}
	if (schema.type === "array" && schema.items) {
		return `${formatSchemaType(schema.items)}[]`;
	}
	if (schema.format) return `${schema.type}<${schema.format}>`;
	return schema.type ?? "any";
}

function inferLang(mediaType: string): string {
	if (mediaType.includes("json")) return "json";
	if (mediaType.includes("xml")) return "xml";
	if (mediaType.includes("yaml") || mediaType.includes("yml")) return "yaml";
	if (mediaType.includes("html")) return "html";
	if (mediaType.includes("text")) return "text";
	return "text";
}

function formatExample(value: unknown, lang: string): string {
	if (lang === "json") {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
	if (typeof value === "string") return value;
	return JSON.stringify(value, null, 2);
}
