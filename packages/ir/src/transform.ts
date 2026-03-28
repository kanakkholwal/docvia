import GithubSlugger from 'github-slugger';
import type { Code, Content, Heading, Image, InlineCode, Link, Root as MdastRoot, Text } from 'mdast';
import { dirname, normalize, resolve, sep } from 'node:path';
import type {
    Dependency,
    FrontmatterData,
    HeadingMeta,
    IRDocument,
    IRNode,
} from './index';

// Transform Context

interface TransformContext {
    headings: HeadingMeta[];
    dependencies: Dependency[];
    slugger: GithubSlugger;
    seenDeps: Set<string>;
    nodeCounter: number;
}

// Public API

export function transformToIR(
    ast: MdastRoot,
    frontmatter: FrontmatterData,
    filePath: string,
): IRDocument {
    const ctx: TransformContext = {
        headings: [],
        dependencies: [],
        slugger: new GithubSlugger(),
        seenDeps: new Set(),
        nodeCounter: 0,
    };

    const children = transformChildren(ast.children as Content[], filePath, ctx);
    const slug = computeSlug(filePath, frontmatter.slug);

    return {
        slug,
        frontmatter,
        children,
        headings: ctx.headings,
        dependencies: ctx.dependencies,
        contentHash: '', // computed later by compiler with composite inputs
    };
}

// Node Transform (Single-Pass DFS)

function transformChildren(
    nodes: readonly Content[],
    filePath: string,
    ctx: TransformContext,
): IRNode[] {
    const result: IRNode[] = [];
    for (const node of nodes) {
        result.push(transformNode(node, filePath, ctx));
    }
    return result;
}

function transformNode(node: Content, filePath: string, ctx: TransformContext): IRNode {
    const nodeId = `${ctx.slugger.slug(filePath)}-${ctx.nodeCounter++}`;

    switch (node.type as string) {
        case 'heading': {
            const h = node as Heading;
            const text = extractPlainText(node);
            const id = ctx.slugger.slug(text);
            ctx.headings.push({ depth: h.depth, text, id });
            return {
                type: 'heading',
                id: nodeId,
                props: { depth: h.depth, id },
                children: transformChildren(h.children as Content[], filePath, ctx),
            };
        }

        case 'paragraph':
            return {
                type: 'paragraph',
                id: nodeId,
                props: {},
                children: transformChildren(
                    (node as { children: Content[] }).children,
                    filePath,
                    ctx,
                ),
            };

        case 'text':
            return { type: 'text', id: nodeId, props: { value: (node as Text).value }, children: [] };

        case 'code': {
            const c = node as Code;
            return {
                type: 'code-block',
                id: nodeId,
                props: { lang: c.lang ?? '', meta: c.meta ?? null, value: c.value },
                children: [],
            };
        }

        case 'inlineCode':
            return {
                type: 'inline-code',
                id: nodeId,
                props: { value: (node as InlineCode).value },
                children: [],
            };

        case 'image': {
            const img = node as Image;
            if (img.url && !img.url.startsWith('http')) {
                addDependency(ctx, { type: 'asset', path: resolve(dirname(filePath), img.url) });
            }
            return {
                type: 'image',
                id: nodeId,
                props: { src: img.url, alt: img.alt ?? '', title: img.title ?? null },
                children: [],
            };
        }

        case 'link': {
            const lnk = node as Link;
            if (lnk.url.endsWith('.md') && !lnk.url.startsWith('http')) {
                addDependency(ctx, { type: 'file', path: resolve(dirname(filePath), lnk.url) });
            }
            return {
                type: 'link',
                id: nodeId,
                props: { href: lnk.url, title: lnk.title ?? null },
                children: transformChildren(lnk.children as Content[], filePath, ctx),
            };
        }

        case 'containerDirective':
        case 'leafDirective': {
            // Directives from remark-directive
            const d = node as Content & {
                name: string;
                attributes?: Record<string, unknown>;
                children?: Content[];
            };
            addDependency(ctx, { type: 'component', name: d.name });

            const attributes = { ...(d.attributes ?? {}) };
            const hydrate = attributes.hydrate;
            attributes.hydrate = undefined;

            // Resolve attributes that look like local file paths
            for (const key in attributes) {
                const val = attributes[key];
                if (typeof val === 'string' && val.startsWith('./')) {
                    addDependency(ctx, {
                        type: 'asset',
                        path: resolve(dirname(filePath), val),
                    });
                }
            }

            return {
                type: (node.type as string) === 'containerDirective' ? 'component' : 'component-inline',
                id: nodeId,
                props: {
                    name: d.name,
                    attributes,
                    hydrate: hydrate ?? 'none',
                },
                children: d.children ? transformChildren(d.children as Content[], filePath, ctx) : [],
            };
        }

        case 'emphasis':
            return {
                type: 'emphasis',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'strong':
            return {
                type: 'strong',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'blockquote':
            return {
                type: 'blockquote',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'list': {
            const list = node as any;
            return {
                type: 'list',
                id: nodeId,
                props: { ordered: list.ordered ?? false, start: list.start ?? 1 },
                children: transformChildren(list.children || [], filePath, ctx),
            };
        }

        case 'listItem':
            return {
                type: 'list-item',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'table': {
            const tbl = node as any;
            return {
                type: 'table',
                id: nodeId,
                props: { align: tbl.align ?? [] },
                children: transformChildren(tbl.children || [], filePath, ctx),
            };
        }

        case 'tableRow':
            return {
                type: 'table-row',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'tableCell':
            return {
                type: 'table-cell',
                id: nodeId,
                props: {},
                children: transformChildren(
                    ((node as any).children || []) as Content[],
                    filePath,
                    ctx,
                ),
            };

        case 'thematicBreak':
            return { type: 'thematic-break', id: nodeId, props: {}, children: [] };

        default: {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`[dockit] Unknown mdast node type: "${node.type}"`);
            }
            return {
                type: 'unknown',
                id: nodeId,
                props: { originalType: node.type },
                children: 'children' in node
                    ? transformChildren((node as any).children || [], filePath, ctx)
                    : [],
            };
        }
    }
}

// Helpers

function addDependency(ctx: TransformContext, dep: Dependency): void {
    let normalized: Dependency;
    if (dep.type === 'component') {
        normalized = dep;
    } else {
        const d = dep as any;
        normalized = {
            ...d,
            path: normalize(d.path).split(sep).join('/'),
        };
    }

    const key = normalized.type === 'component' ? `c:${normalized.name}` : `${normalized.type}:${(normalized as any).path}`;
    if (!ctx.seenDeps.has(key)) {
        ctx.seenDeps.add(key);
        ctx.dependencies.push(normalized);
    }
}

function extractPlainText(node: Content): string {
    if ('value' in node && typeof node.value === 'string') return node.value;
    if ('children' in (node as any)) {
        return ((node as any).children as Content[]).map(extractPlainText).join('');
    }
    return '';
}

function computeSlug(filePath: string, explicitSlug?: string): string {
    if (explicitSlug) return explicitSlug;
    return filePath
        .replace(/\\/g, '/')
        .replace(/\.md$/, '')
        .replace(/\/index$/, '')
        .split('/')
        .pop() ?? 'index';
}
