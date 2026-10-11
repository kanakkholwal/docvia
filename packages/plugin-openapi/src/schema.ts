import type { ApiSchema, Html } from "./model";
import { resolveRef } from "./spec";
import type { OpenAPIDocument } from "./types";

type Raw = Record<string, unknown>;

export interface SchemaContext {
	readonly doc: OpenAPIDocument;
	readonly markdown: (text: unknown) => Html | undefined;
}

const isObject = (value: unknown): value is Raw =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const refName = (ref: string) => ref.split("/").at(-1) ?? ref;

/** Follows a `$ref` chain. 3.1 allows siblings beside `$ref`; they win over the target. */
export function deref(
	doc: OpenAPIDocument,
	value: unknown,
	stack: ReadonlySet<string> = new Set(),
): {
	schema: Raw;
	ref?: string;
	stack: ReadonlySet<string>;
	circular?: boolean;
} {
	let schema = isObject(value) ? value : {};
	let ref: string | undefined;
	let seen = stack;
	while (typeof schema.$ref === "string") {
		const pointer = schema.$ref;
		ref = refName(pointer);
		if (seen.has(pointer))
			return { schema: {}, ref, stack: seen, circular: true };
		const target = resolveRef(doc, pointer);
		if (!isObject(target)) return { schema: {}, ref, stack: seen };
		seen = new Set(seen).add(pointer);
		const { $ref: _, ...siblings } = schema;
		schema = { ...target, ...siblings };
	}
	return { schema, ref, stack: seen };
}

/** Folds `allOf` parts into one schema: properties and `required` union, other keys first wins. */
function mergeAllOf(
	doc: OpenAPIDocument,
	schema: Raw,
	stack: ReadonlySet<string>,
): Raw {
	if (!Array.isArray(schema.allOf)) return schema;
	const { allOf, ...own } = schema;
	const merged: Raw = { ...own };
	const properties: Raw = {
		...(isObject(own.properties) ? own.properties : {}),
	};
	const required = new Set<string>(
		Array.isArray(own.required) ? own.required : [],
	);
	for (const part of allOf) {
		const resolved = deref(doc, part, stack);
		const flat = mergeAllOf(doc, resolved.schema, resolved.stack);
		for (const [key, value] of Object.entries(flat)) {
			if (key === "properties" && isObject(value))
				Object.assign(properties, value);
			else if (key === "required" && Array.isArray(value))
				for (const name of value) required.add(String(name));
			else if (!(key in merged)) merged[key] = value;
		}
	}
	if (Object.keys(properties).length > 0) merged.properties = properties;
	if (required.size > 0) merged.required = [...required];
	return merged;
}

function typesOf(schema: Raw): string[] {
	if (Array.isArray(schema.type)) return schema.type.map(String);
	if (typeof schema.type === "string") return [schema.type];
	if (isObject(schema.properties) || isObject(schema.additionalProperties))
		return ["object"];
	if (schema.items !== undefined) return ["array"];
	return [];
}

function constraintsOf(schema: Raw): string[] {
	const out: string[] = [];
	const num = (key: string) =>
		typeof schema[key] === "number" ? (schema[key] as number) : undefined;
	const pairs: Array<[string, (n: number) => string]> = [
		["minimum", (n) => `>= ${n}`],
		["exclusiveMinimum", (n) => `> ${n}`],
		["maximum", (n) => `<= ${n}`],
		["exclusiveMaximum", (n) => `< ${n}`],
		["multipleOf", (n) => `multiple of ${n}`],
		["minLength", (n) => `min length ${n}`],
		["maxLength", (n) => `max length ${n}`],
		["minItems", (n) => `min items ${n}`],
		["maxItems", (n) => `max items ${n}`],
	];
	for (const [key, label] of pairs) {
		const n = num(key);
		if (n !== undefined) out.push(label(n));
	}
	if (typeof schema.pattern === "string") out.push(`pattern ${schema.pattern}`);
	if (schema.uniqueItems === true) out.push("unique items");
	return out;
}

const json = (value: unknown) => JSON.stringify(value);

/** Converts a raw schema into the display tree, expanding refs once per branch. */
export function toApiSchema(
	ctx: SchemaContext,
	value: unknown,
	stack: ReadonlySet<string> = new Set(),
): ApiSchema {
	const resolved = deref(ctx.doc, value, stack);
	if (resolved.circular)
		return {
			type: resolved.ref ?? "object",
			ref: resolved.ref,
			circular: true,
			constraints: [],
		};
	const schema = mergeAllOf(ctx.doc, resolved.schema, resolved.stack);
	const inner = resolved.stack;
	const types = typesOf(schema);
	const nullable = types.includes("null") || schema.nullable === true;
	const main = types.filter((t) => t !== "null");

	const required = new Set(
		Array.isArray(schema.required) ? schema.required.map(String) : [],
	);
	const fields = isObject(schema.properties)
		? Object.entries(schema.properties).map(([name, prop]) => ({
				name,
				required: required.has(name),
				schema: toApiSchema(ctx, prop, inner),
			}))
		: undefined;
	const items =
		schema.items !== undefined
			? toApiSchema(ctx, schema.items, inner)
			: undefined;
	const additional = isObject(schema.additionalProperties)
		? toApiSchema(ctx, schema.additionalProperties, inner)
		: undefined;
	const variantKind: "oneOf" | "anyOf" | undefined = Array.isArray(schema.oneOf)
		? "oneOf"
		: Array.isArray(schema.anyOf)
			? "anyOf"
			: undefined;
	const variants = variantKind
		? {
				kind: variantKind,
				options: (schema[variantKind] as unknown[]).map((option) =>
					toApiSchema(ctx, option, inner),
				),
			}
		: undefined;

	let type: string;
	if (nullable && main.length === 0 && !fields && !variants) type = "null";
	else if (main.includes("array")) type = `array<${items?.type ?? "unknown"}>`;
	else if (main.includes("object") || (main.length === 0 && fields))
		type =
			resolved.ref ??
			(additional && !fields ? `record<string, ${additional.type}>` : "object");
	else if (main.length > 0)
		type = main
			.map((t) =>
				typeof schema.format === "string" ? `${t}<${schema.format}>` : t,
			)
			.join(" | ");
	else if (variants)
		type = resolved.ref ?? variants.options.map((o) => o.type).join(" | ");
	else type = schema.const !== undefined ? typeof schema.const : "any";
	if (nullable && type !== "null") type += " | null";

	const enumValues = Array.isArray(schema.enum)
		? schema.enum.map(json)
		: schema.const !== undefined
			? [json(schema.const)]
			: undefined;
	return {
		type,
		ref: resolved.ref,
		description: ctx.markdown(schema.description),
		deprecated: schema.deprecated === true || undefined,
		readOnly: schema.readOnly === true || undefined,
		writeOnly: schema.writeOnly === true || undefined,
		nullable: nullable || undefined,
		enum: enumValues,
		default: schema.default !== undefined ? json(schema.default) : undefined,
		constraints: constraintsOf(schema),
		fields,
		items,
		additional,
		variants,
	};
}

const STRING_FORMATS: Record<string, string> = {
	"date-time": "2024-01-01T12:00:00Z",
	date: "2024-01-01",
	time: "12:00:00",
	email: "user@example.com",
	uuid: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
	uri: "https://example.com",
	url: "https://example.com",
	hostname: "example.com",
	ipv4: "192.0.2.1",
	ipv6: "2001:db8::1",
	byte: "U3dhZ2dlcg==",
	password: "********",
};

/** An explicit example from the schema, or `undefined` when it has none of its own. */
export function declaredExample(schema: Raw): unknown {
	if (schema.example !== undefined) return schema.example;
	if (Array.isArray(schema.examples) && schema.examples.length > 0)
		return schema.examples[0];
	if (schema.const !== undefined) return schema.const;
	if (schema.default !== undefined) return schema.default;
	if (Array.isArray(schema.enum) && schema.enum.length > 0)
		return schema.enum[0];
	return undefined;
}

/** A plausible value for the schema. Request samples drop `readOnly` fields, responses `writeOnly`. */
export function sampleValue(
	doc: OpenAPIDocument,
	value: unknown,
	mode: "request" | "response",
	stack: ReadonlySet<string> = new Set(),
): unknown {
	const resolved = deref(doc, value, stack);
	if (resolved.circular) return {};
	const schema = mergeAllOf(doc, resolved.schema, resolved.stack);
	const inner = resolved.stack;
	const declared = declaredExample(schema);
	if (declared !== undefined) return declared;
	for (const key of ["oneOf", "anyOf"] as const) {
		const options = schema[key];
		if (Array.isArray(options) && options.length > 0)
			return sampleValue(doc, options[0], mode, inner);
	}
	const type = typesOf(schema).find((t) => t !== "null");
	switch (type) {
		case "object": {
			const out: Raw = {};
			const props = isObject(schema.properties) ? schema.properties : {};
			for (const [name, prop] of Object.entries(props)) {
				const flags = deref(doc, prop, inner).schema;
				if (mode === "request" && flags.readOnly === true) continue;
				if (mode === "response" && flags.writeOnly === true) continue;
				out[name] = sampleValue(doc, prop, mode, inner);
			}
			if (
				Object.keys(out).length === 0 &&
				isObject(schema.additionalProperties)
			)
				out.key = sampleValue(doc, schema.additionalProperties, mode, inner);
			return out;
		}
		case "array":
			return schema.items === undefined
				? []
				: [sampleValue(doc, schema.items, mode, inner)];
		case "integer":
		case "number":
			return typeof schema.minimum === "number" ? schema.minimum : 0;
		case "boolean":
			return true;
		case "string":
			return (
				(typeof schema.format === "string" && STRING_FORMATS[schema.format]) ||
				"string"
			);
		default:
			return null;
	}
}
