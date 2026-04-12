import type { Root as HastRoot } from "hast";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// Sanitize schema — HTML-native attribute names only, no React leakage
// biome-ignore lint/suspicious/noExplicitAny: rehype-sanitize Schema type not exported directly
const sanitizeSchema: any = {
	...defaultSchema,
	tagNames: [
		...(defaultSchema.tagNames || []),
		"div",
		"span",
		"blockquote",
		"hr",
		"table",
		"thead",
		"tbody",
		"tr",
		"td",
		"th",
		"p",
		"ul",
		"ol",
		"li",
		"strong",
		"em",
		"code",
		"pre",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"img",
		"br",
	],
	attributes: {
		...defaultSchema.attributes,
		"*": [
			...(defaultSchema.attributes?.["*"] || []),
			"className",
			"style",
			"class",
			"data*", // Allow all data attributes
		],
		a: ["href", "title", "target", "rel"],
		img: ["src", "alt", "title"],
	},
};

// Custom remark plugin: converts directive nodes into HAST-compatible elements
// so that remarkRehype can pass them through as structured nodes instead of dropping them.
function remarkDirectiveToHast() {
	return (tree: any) => {
		visit(tree, (node: any) => {
			if (node.type === "containerDirective" || node.type === "leafDirective") {
				// Prefix directive attributes with data-prop- so they survive rehype-sanitize
				const attrs: Record<string, string> = {};
				for (const [key, value] of Object.entries(node.attributes ?? {})) {
					attrs[`data-prop-${key}`] = String(value);
				}
				node.data = {
					...node.data,
					hName: "div",
					hProperties: {
						"data-directive": node.name,
						"data-directive-type":
							node.type === "containerDirective" ? "block" : "inline",
						...attrs,
					},
				};
			}
		});
	};
}

export interface ParseOptions {
	// biome-ignore lint/suspicious/noExplicitAny: remark plugins are untyped
	readonly remarkPlugins?: readonly any[];
}

export interface ParseResult {
	readonly ast: HastRoot;
}

// Cache processors by remarkPlugins array reference.
// The array reference is stable within a single build (same config object),
// so we avoid rebuilding the unified pipeline for every document.
// biome-ignore lint/suspicious/noExplicitAny: unified processor chain widens type on each .use()
let baseProcessor: any | null = null;
// biome-ignore lint/suspicious/noExplicitAny: plugin arrays are untyped
const pluginProcessorCache = new WeakMap<readonly any[], any>();

// biome-ignore lint/suspicious/noExplicitAny: unified processor chain widens type on each .use()
function buildProcessor(remarkPlugins: readonly any[]): any {
	// biome-ignore lint/suspicious/noExplicitAny: unified processor chain widens type on each .use()
	let processor: any = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkDirective)
		.use(remarkDirectiveToHast);

	for (const plugin of remarkPlugins) {
		processor = processor.use(plugin);
	}

	return processor
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize, sanitizeSchema);
}

export async function parseMarkdown(
	content: string,
	options?: ParseOptions,
): Promise<ParseResult> {
	const remarkPlugins = options?.remarkPlugins;

	// biome-ignore lint/suspicious/noExplicitAny: unified processor chain widens type on each .use()
	let processor: any;
	if (!remarkPlugins || remarkPlugins.length === 0) {
		if (!baseProcessor) baseProcessor = buildProcessor([]);
		processor = baseProcessor;
	} else {
		let cached = pluginProcessorCache.get(remarkPlugins);
		if (!cached) {
			cached = buildProcessor(remarkPlugins);
			pluginProcessorCache.set(remarkPlugins, cached);
		}
		processor = cached;
	}

	const mdastTree = processor.parse(content);
	const hast = (await processor.run(mdastTree)) as HastRoot;

	return { ast: hast };
}
