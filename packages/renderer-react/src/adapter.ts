import type { IRDocument, PageMeta, RenderedPage, RendererAdapter } from '@docvia/ir';
import {
    type ComponentRegistry,
    type RenderContext,
    type SyntaxHighlighter,
    createDefaultRendererMap,
    renderDocument,
} from '@docvia/renderer-core';

// ---------------------------------------------------------------------------
// Shiki highlighter
// ---------------------------------------------------------------------------

/**
 * Creates a lazy-initialised shiki highlighter.
 *
 * The shiki instance is created on first use and reused for all subsequent
 * highlight calls. Dynamic import keeps shiki out of any browser bundle if
 * this factory is only ever called server-side (build / SSR).
 */
export function createShikiHighlighter(opts?: {
    theme?: string;
    langs?: string[];
}): SyntaxHighlighter {
    let instance: any = null;

    async function getInstance(): Promise<any> {
        if (!instance) {
            const { createHighlighter } = await import('shiki');
            instance = await createHighlighter({
                themes: [opts?.theme ?? 'github-dark'],
                langs: opts?.langs ?? [
                    'javascript',
                    'typescript',
                    'bash',
                    'json',
                    'css',
                    'html',
                    'jsx',
                    'tsx',
                ],
            });
        }
        return instance;
    }

    return {
        async highlight(code: string, lang: string) {
            const h = await getInstance();
            try {
                const html = h.codeToHtml(code, { lang, theme: opts?.theme ?? 'github-dark' });
                return { html };
            } catch {
                return { html: `<pre><code>${escapeHtml(code)}</code></pre>` };
            }
        },
    };
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// React renderer adapter
// ---------------------------------------------------------------------------

/**
 * Creates a docvia RendererAdapter for React.
 *
 * The adapter runs at build time (or server-side in dev mode). It walks the
 * IR document through the default renderer pipeline and serialises the result
 * as a JS module exporting `meta`, `content`, and `manifest`.
 *
 * The exported `content` is consumed at runtime by `<DocviaContent nodes={content}>`.
 * This keeps the adapter output framework-agnostic — it is pure JSON that any
 * React environment (Next.js App Router, Pages Router, Vite SPA) can consume.
 */
export function createReactRenderer(options: {
    highlighter?: SyntaxHighlighter;
    registry?: ComponentRegistry;
} = {}): RendererAdapter {
    const hl = options.highlighter ?? createShikiHighlighter();
    const registry = options.registry ?? { resolve: () => null };

    return {
        name: 'react',

        async renderPage(doc: IRDocument): Promise<RenderedPage> {
            const ctx: Omit<RenderContext, 'manifest'> = {
                slug: doc.slug,
                meta: {
                    slug: doc.slug,
                    title: doc.frontmatter.title,
                    description: doc.frontmatter.description,
                    headings: doc.headings,
                    contentHash: doc.contentHash,
                    lastModified: Date.now(),
                    tags: doc.frontmatter.tags,
                    order: doc.frontmatter.order,
                },
                registry,
                highlighter: hl,
            };

            const { output, manifest } = await renderDocument(doc, createDefaultRendererMap(), ctx);

            // Emit a plain JS module. The consumer imports `content` and passes
            // it to <DocviaContent nodes={content} />.
            const code = [
                `export const meta = ${JSON.stringify(ctx.meta, null, 2)};`,
                '',
                `export const content = ${JSON.stringify(output, null, 2)};`,
                '',
                `export const manifest = ${JSON.stringify(manifest, null, 2)};`,
                '',
            ].join('\n');

            return {
                slug: doc.slug,
                code,
                contentHash: doc.contentHash,
            };
        },

        async renderManifest(pages: readonly PageMeta[]): Promise<string> {
            const manifest = {
                pages: pages.map(p => ({
                    slug: p.slug,
                    title: p.title,
                    description: p.description,
                    headings: p.headings,
                    contentHash: p.contentHash,
                    tags: p.tags,
                    order: p.order,
                })),
                generatedAt: new Date().toISOString(),
            };
            return JSON.stringify(manifest, null, 2);
        },
    };
}

// ---------------------------------------------------------------------------
// Vite virtual-module plugin
// ---------------------------------------------------------------------------

export interface InMemoryStore {
    get(slug: string): RenderedPage | undefined;
    set(slug: string, page: RenderedPage): void;
    entries(): IterableIterator<[string, RenderedPage]>;
}

export function createInMemoryStore(): InMemoryStore {
    const store = new Map<string, RenderedPage>();
    return {
        get: slug => store.get(slug),
        set: (slug, page) => store.set(slug, page),
        entries: () => store.entries(),
    };
}

const VIRTUAL_PREFIX = 'virtual:docvia/';
const RESOLVED_PREFIX = '\0virtual:docvia/';

/**
 * Vite plugin that resolves `virtual:docvia/<slug>` to the in-memory compiled
 * page module. Framework-agnostic — same as the Svelte adapter.
 */
export function docviaVitePlugin(store: InMemoryStore) {
    return {
        name: 'docvia-react',

        resolveId(id: string) {
            if (id.startsWith(VIRTUAL_PREFIX)) return `\0${id}`;
            return undefined;
        },

        load(id: string) {
            if (id.startsWith(RESOLVED_PREFIX)) {
                const slug = id.slice(RESOLVED_PREFIX.length);
                const page = store.get(slug);
                if (!page) return null;
                return { code: page.code, map: (page as any).map ?? null };
            }
            return undefined;
        },
    };
}

/**
 * Signals Vite's dev server to invalidate and push HMR updates for the given
 * page slugs. Call this after re-compiling changed documents.
 */
export function invalidateModules(
    slugs: string[],
    // biome-ignore lint/suspicious/noExplicitAny: Vite server type not imported to avoid bundling vite
    server: any,
): void {
    for (const slug of slugs) {
        const moduleId = RESOLVED_PREFIX + slug;
        const mod = server.moduleGraph?.getModuleById(moduleId);
        if (mod) server.moduleGraph.invalidateModule(mod);
    }
    server.ws?.send({
        type: 'update',
        updates: slugs.map(slug => ({
            type: 'js-update' as const,
            path: VIRTUAL_PREFIX + slug,
            acceptedPath: VIRTUAL_PREFIX + slug,
            timestamp: Date.now(),
        })),
    });
}