import GithubSlugger from "github-slugger";
import type { Element, Root as HastRoot, Text } from "hast";
import { dirname, normalize, resolve, sep } from "node:path";
import type {
	Dependency,
	FrontmatterData,
	HeadingMeta,
	IRDocument,
	IRNode,
	IRNodeType,
} from "./index";

// Coerce HTML attribute string values to proper JS types
function coerceValue(value: unknown): unknown {
	if (typeof value !== "string") return value;
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "null") return null;
	if (value === "undefined") return undefined;
	const num = Number(value);
	if (!Number.isNaN(num) && value.trim() !== "") return num;
	// Try JSON (arrays, objects)
	if (
		(value.startsWith("[") && value.endsWith("]")) ||
		(value.startsWith("{") && value.endsWith("}"))
	) {
		try {
			return JSON.parse(value);
		} catch {
			// not valid JSON, return as string
		}
	}
	return value;
}

// Transform Context

interface TransformContext {
	headings: HeadingMeta[];
	dependencies: Dependency[];
	slugger: GithubSlugger;
	seenDeps: Set<string>;
	nodeCounter: number;
	filePath: string;
}

// Public API

export function transformToIR(
	ast: HastRoot,
	frontmatter: FrontmatterData,
	filePath: string,
): IRDocument {
	const ctx: TransformContext = {
		headings: [],
		dependencies: [],
		slugger: new GithubSlugger(),
		seenDeps: new Set(),
		nodeCounter: 0,
		filePath,
	};

	const children = transformChildren(ast.children, ctx);
	const slug = computeSlug(filePath, frontmatter.slug);

	return {
		slug,
		frontmatter,
		children,
		headings: ctx.headings,
		dependencies: ctx.dependencies,
		contentHash: "", // computed later by compiler with composite inputs
	};
}

// Prop Normalization — enforces the IR contract (no className, no style objects)

export function normalizeProps(
	properties: Record<string, unknown> = {},
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const key in properties) {
		const value = properties[key];
		if (value === undefined || value === null) continue;

		if (key === "className") {
			// HAST stores className as string[] — join to a plain string
			out["class"] = Array.isArray(value) ? value.join(" ") : String(value);
			continue;
		}

		if (key === "style" && typeof value === "object" && !Array.isArray(value)) {
			// Convert style object to inline string
			out["style"] = Object.entries(value as Record<string, unknown>)
				.filter(([, v]) => v !== undefined && v !== null)
				.map(([k, v]) => `${k}:${v}`)
				.join(";");
			continue;
		}

		out[key] = value;
	}

	return out;
}

// Semantic tag map

const HEADING_RE = /^h([1-6])$/;

const SEMANTIC_TAG_MAP: Record<string, IRNodeType> = {
	p: "paragraph",
	ul: "list",
	ol: "list",
	li: "list-item",
	a: "link",
	img: "image",
	em: "emphasis",
	strong: "strong",
	blockquote: "blockquote",
	hr: "thematic-break",
	table: "table",
	tr: "table-row",
	td: "table-cell",
	th: "table-cell",
};

// Tags that are blocked for security
const BLOCKED_TAGS = new Set(["script", "iframe", "object", "embed"]);

// Child traversal

function transformChildren(nodes: any[], ctx: TransformContext): IRNode[] {
	const result: IRNode[] = [];
	for (const node of nodes) {
		const ir = transformNode(node, ctx);
		if (ir !== null) result.push(ir);
	}
	return result;
}

// Node transform (HAST)

function transformNode(node: any, ctx: TransformContext): IRNode | null {
	// HAST text node
	if (node.type === "text") {
		return transformText(node as Text, ctx);
	}

	// Raw nodes should not survive rehype-raw, but guard anyway
	if (node.type === "raw") {
		if (process.env.NODE_ENV !== "production") {
			console.warn("[docvia] Unexpected raw HAST node — skipping");
		}
		return null;
	}

	// Root / doctype / comment — skip non-element nodes at top level
	if (node.type !== "element") {
		return null;
	}

	return transformElement(node as Element, ctx);
}

// Text node

function transformText(node: Text, ctx: TransformContext): IRNode {
	const nodeId = nextId(ctx);
	return {
		type: "text",
		id: nodeId,
		props: { value: node.value },
		children: [],
	};
}

// Element node

function transformElement(node: Element, ctx: TransformContext): IRNode | null {
	const tag = node.tagName;
	const nodeId = nextId(ctx);
	const props = normalizeProps(node.properties as Record<string, unknown>);

	// Security: drop blocked tags silently
	if (BLOCKED_TAGS.has(tag)) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(`[docvia] Blocked tag <${tag}> — skipped`);
		}
		return null;
	}

	// --- Directive passthrough (from remarkDirectiveToHast) ---
	// Note: rehype-sanitize may camelCase these to dataDirective/dataDirectiveType
	const directiveName = (props["data-directive"] || props.dataDirective) as
		| string
		| undefined;
	const directiveType = (props["data-directive-type"] ||
		props.dataDirectiveType) as string | undefined;

	if (directiveName) {
		const name = directiveName;
		const isInline = directiveType !== "block";

		addDependency(ctx, { type: "component", name });

		// Extract directive props from data-prop-* attributes (prefixed to survive sanitization)
		const attributes: Record<string, unknown> = {};
		let hydrate: string = "none";
		for (const [key, value] of Object.entries(props)) {
			if (key.startsWith("data-prop-") || key.startsWith("dataProp")) {
				const propName = key.startsWith("data-prop-")
					? key.slice("data-prop-".length)
					: key.charAt("dataProp".length).toLowerCase() + key.slice("dataProp".length + 1);
				if (propName === "hydrate") {
					hydrate = String(value);
				} else {
					attributes[propName] = coerceValue(value);
				}
			}
		}

		return {
			type: isInline ? "component-inline" : "component",
			id: nodeId,
			props: { name, attributes, hydrate },
			children: isInline ? [] : transformChildren(node.children, ctx),
		};
	}

	// --- Heading ---
	const headingMatch = HEADING_RE.exec(tag);
	if (headingMatch) {
		const depth = Number(headingMatch[1]);
		const text = extractPlainText(node);
		const id = ctx.slugger.slug(text);
		ctx.headings.push({ depth, text, id });
		return {
			type: "heading",
			id: nodeId,
			props: { depth, id },
			children: transformChildren(node.children, ctx),
		};
	}

	// --- Code block: <pre><code class="language-X">...</code></pre> ---
	if (tag === "pre") {
		const codeChild = node.children.find(
			(c) => c.type === "element" && c.tagName === "code",
		) as Element | undefined;

		if (codeChild) {
			const codeProps = normalizeProps(
				codeChild.properties as Record<string, unknown>,
			);
			const lang = extractLang(codeProps["class"] as string | undefined);
			const value = extractPlainText(codeChild);
			return {
				type: "code-block",
				id: nodeId,
				props: { lang, value, meta: null },
				children: [],
			};
		}

		// <pre> without <code> child — treat as generic element
	}

	// --- Inline code (top-level <code>, not inside <pre>) ---
	if (tag === "code") {
		return {
			type: "inline-code",
			id: nodeId,
			props: { value: extractPlainText(node) },
			children: [],
		};
	}

	// --- List ---
	if (tag === "ul" || tag === "ol") {
		return {
			type: "list",
			id: nodeId,
			props: { ordered: tag === "ol", start: 1, ...props },
			children: transformChildren(node.children, ctx),
		};
	}

	// --- Link ---
	if (tag === "a") {
		const href = (props["href"] as string) ?? "";
		if (href.endsWith(".md") && !href.startsWith("http")) {
			addDependency(ctx, {
				type: "file",
				path: resolve(dirname(ctx.filePath), href),
			});
		}
		return {
			type: "link",
			id: nodeId,
			props: { href, title: props["title"] ?? null, ...filterClass(props) },
			children: transformChildren(node.children, ctx),
		};
	}

	// --- Image ---
	if (tag === "img") {
		const src = (props["src"] as string) ?? "";
		if (src && !src.startsWith("http")) {
			addDependency(ctx, {
				type: "asset",
				path: resolve(dirname(ctx.filePath), src),
			});
		}
		return {
			type: "image",
			id: nodeId,
			props: { src, alt: props["alt"] ?? "", title: props["title"] ?? null },
			children: [],
		};
	}

	// --- Semantic map lookup ---
	const semanticType = SEMANTIC_TAG_MAP[tag];
	if (semanticType) {
		// Preserve original tag for nodes where the tag carries semantic meaning
		// (e.g. th vs td both map to table-cell but render differently)
		const extraProps = semanticType === "table-cell" ? { tag } : {};
		return {
			type: semanticType,
			id: nodeId,
			props: { ...props, ...extraProps },
			children: transformChildren(node.children, ctx),
		};
	}

	// --- Fallback: generic element passthrough ---
	return {
		type: "element",
		id: nodeId,
		props: { tag, ...props },
		children: transformChildren(node.children, ctx),
	};
}

// Helpers

function nextId(ctx: TransformContext): string {
	return `node-${ctx.nodeCounter++}`;
}

function filterClass(props: Record<string, unknown>): Record<string, unknown> {
	const { class: cls } = props;
	return cls !== undefined ? { class: cls } : {};
}

/** Extract plain text content from a HAST element or text node */
function extractPlainText(node: any): string {
	if (node.type === "text") return node.value as string;
	if (Array.isArray(node.children)) {
		return (node.children as any[]).map(extractPlainText).join("");
	}
	return "";
}

/** Extract language from "language-ts" style class string */
function extractLang(classStr: string | undefined): string {
	if (!classStr) return "";
	const match = /language-(\S+)/.exec(classStr);
	return match?.[1] ?? "";
}

function addDependency(ctx: TransformContext, dep: Dependency): void {
	let normalized: Dependency;
	if (dep.type === "component") {
		normalized = dep;
	} else {
		const d = dep as Extract<Dependency, { type: "file" | "asset" }>;
		normalized = {
			...d,
			path: normalize(d.path).split(sep).join("/"),
		};
	}

	const key =
		normalized.type === "component"
			? `c:${normalized.name}`
			: `${normalized.type}:${(normalized as any).path}`;

	if (!ctx.seenDeps.has(key)) {
		ctx.seenDeps.add(key);
		ctx.dependencies.push(normalized);
	}
}

function computeSlug(filePath: string, explicitSlug?: string): string {
	if (explicitSlug) return explicitSlug;
	return (
		filePath
			.replace(/\\/g, "/")
			.replace(/\.md$/, "")
			.replace(/\/index$/, "") || "index"
	);
}
