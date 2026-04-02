import type { HydrationMode } from '@docvia/ir';
import { RenderError } from './errors';
import { renderNodes } from './render';
import type { RendererMap } from './types';

export function createDefaultRendererMap(): RendererMap {
    const defaultMap = {} as RendererMap;

    const map: RendererMap = {
        paragraph: async (n, ctx) => ({
            kind: 'element',
            tag: 'p',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        heading: async (n, ctx) => ({
            kind: 'element',
            tag: `h${n.props.depth}`,
            props: { id: n.props.id },
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        text: async (n) => ({ kind: 'text', value: n.props.value as string }),

        emphasis: async (n, ctx) => ({
            kind: 'element',
            tag: 'em',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        strong: async (n, ctx) => ({
            kind: 'element',
            tag: 'strong',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        'code-block': async (n, ctx) => {
            try {
                const res = await ctx.highlighter.highlight(
                    n.props.value as string,
                    (n.props.lang as string) || '',
                );
                return {
                    kind: 'element',
                    tag: 'div',
                    props: { class: 'docvia-code-block' },
                    children: [{ kind: 'html', value: res.html }], // Raw HTML injection
                    id: n.id,
                };
            } catch (e) {
                ctx.onError?.(new RenderError('HIGHLIGHT_ERROR', String(e), n));
                return {
                    kind: 'element',
                    tag: 'pre',
                    children: [{ kind: 'text', value: n.props.value as string }],
                    id: n.id,
                };
            }
        },

        'inline-code': async (n) => ({
            kind: 'element',
            tag: 'code',
            children: [{ kind: 'text', value: n.props.value as string }],
        }),

        image: async (n) => ({
            kind: 'element',
            tag: 'img',
            props: { src: n.props.src, alt: n.props.alt, title: n.props.title },
        }),

        link: async (n, ctx) => ({
            kind: 'element',
            tag: 'a',
            props: { href: n.props.href, title: n.props.title },
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        list: async (n, ctx) => ({
            kind: 'element',
            tag: n.props.ordered ? 'ol' : 'ul',
            props: n.props.ordered ? { start: n.props.start } : {},
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        'list-item': async (n, ctx) => ({
            kind: 'element',
            tag: 'li',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        table: async (n, ctx) => ({
            kind: 'element',
            tag: 'table',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        'table-row': async (n, ctx) => ({
            kind: 'element',
            tag: 'tr',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        'table-cell': async (n, ctx) => ({
            kind: 'element',
            tag: (n.props.tag as string | undefined) === 'th' ? 'th' : 'td',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        blockquote: async (n, ctx) => ({
            kind: 'element',
            tag: 'blockquote',
            children: await renderNodes(n.children, defaultMap, ctx),
        }),

        'thematic-break': async () => ({
            kind: 'element',
            tag: 'hr',
        }),

        component: async (node, ctx) => {
            const name = node.props.name as string;
            const resolved = ctx.registry.resolve(name);

            if (!resolved) {
                throw new RenderError('MISSING_COMPONENT', `Component not found: ${name}`, node);
            }

            const hydrate = (node.props.hydrate as HydrationMode) ?? 'none';
            const attributes = (node.props.attributes as Record<string, unknown>) ?? {};
            const mergedProps = { ...resolved.defaultProps, ...attributes };

            return {
                kind: 'component',
                name,
                props: mergedProps,
                hydrate,
                id: node.id!,
                children: await renderNodes(node.children, defaultMap, ctx),
            };
        },

        'component-inline': async (node, ctx) => {
            const name = node.props.name as string;
            const resolved = ctx.registry.resolve(name);

            if (!resolved) {
                throw new RenderError('MISSING_COMPONENT', `Component not found: ${name}`, node);
            }

            const hydrate = (node.props.hydrate as HydrationMode) ?? 'none';
            const attributes = (node.props.attributes as Record<string, unknown>) ?? {};
            const mergedProps = { ...resolved.defaultProps, ...attributes };

            return {
                kind: 'component',
                name,
                props: mergedProps,
                hydrate,
                id: node.id!,
                children: [],
            };
        },

        unknown: async (n) => ({
            kind: 'element',
            tag: 'div',
            props: { 'data-unknown-type': n.props.originalType },
            children: [{ kind: 'text', value: `Unknown node type: ${n.props.originalType}` }],
        }),

        element: async (n, ctx) => {
            const { tag, ...rest } = n.props;
            return {
                kind: 'element',
                tag: tag as string,
                props: rest,
                children: await renderNodes(n.children, defaultMap, ctx),
            };
        },
    };

    Object.assign(defaultMap, map);
    return defaultMap;
}
