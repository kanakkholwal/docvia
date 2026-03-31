import type { Root as HastRoot } from 'hast';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

// Sanitize schema — HTML-native attribute names only, no React leakage
// biome-ignore lint/suspicious/noExplicitAny: rehype-sanitize Schema type not exported directly
const sanitizeSchema: any = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames || []),
        'div', 'span', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'br',
    ],
    attributes: {
        ...defaultSchema.attributes,
        '*': [
            ...(defaultSchema.attributes?.['*'] || []),
            'className',
            'style',
            'class',
            'data*', // Allow all data attributes
        ],
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title'],
    },
};

// Custom remark plugin: converts directive nodes into HAST-compatible elements
// so that remarkRehype can pass them through as structured nodes instead of dropping them.
function remarkDirectiveToHast() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === 'containerDirective' || node.type === 'leafDirective') {
                node.data = {
                    ...node.data,
                    hName: 'div',
                    hProperties: {
                        'data-directive': node.name,
                        'data-directive-type': node.type === 'containerDirective' ? 'block' : 'inline',
                        ...(node.attributes ?? {}),
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

export async function parseMarkdown(
    content: string,
    options?: ParseOptions,
): Promise<ParseResult> {
    // Build base pipeline through MDAST plugins
    // biome-ignore lint/suspicious/noExplicitAny: unified processor chain widens type on each .use()
    let processor: any = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .use(remarkDirectiveToHast);

    // User remark plugins run on MDAST, before hast conversion
    for (const plugin of options?.remarkPlugins ?? []) {
        processor = processor.use(plugin);
    }

    processor = processor
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitize, sanitizeSchema);

    const mdastTree = processor.parse(content);
    const hast = (await processor.run(mdastTree)) as HastRoot;

    return { ast: hast };
}
