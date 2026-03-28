import { RenderError } from './errors';
import { renderNodes } from './render';
export function createDefaultRendererMap() {
    const defaultMap = {};
    const map = {
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
        text: async (n) => ({ kind: 'text', value: n.props.value }),
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
                const res = await ctx.highlighter.highlight(n.props.value, n.props.lang || '');
                return {
                    kind: 'element',
                    tag: 'div',
                    props: { class: 'dockit-code-block' },
                    children: [{ kind: 'text', value: res.html }], // Raw HTML handled by adapter
                    id: n.id,
                };
            }
            catch (e) {
                ctx.onError?.(new RenderError('HIGHLIGHT_ERROR', String(e), n));
                return {
                    kind: 'element',
                    tag: 'pre',
                    children: [{ kind: 'text', value: n.props.value }],
                    id: n.id,
                };
            }
        },
        'inline-code': async (n) => ({
            kind: 'element',
            tag: 'code',
            children: [{ kind: 'text', value: n.props.value }],
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
            tag: 'td', // Align props could be added here
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
            const name = node.props.name;
            const resolved = ctx.registry.resolve(name);
            if (!resolved) {
                throw new RenderError('MISSING_COMPONENT', `Component not found: ${name}`, node);
            }
            const hydrate = node.props.hydrate ?? 'none';
            const attributes = node.props.attributes ?? {};
            const mergedProps = { ...resolved.defaultProps, ...attributes };
            return {
                kind: 'component',
                name,
                props: mergedProps,
                hydrate,
                id: node.id,
                children: await renderNodes(node.children, defaultMap, ctx),
            };
        },
        'component-inline': async (node, ctx) => {
            const name = node.props.name;
            const resolved = ctx.registry.resolve(name);
            if (!resolved) {
                throw new RenderError('MISSING_COMPONENT', `Component not found: ${name}`, node);
            }
            const hydrate = node.props.hydrate ?? 'none';
            const attributes = node.props.attributes ?? {};
            const mergedProps = { ...resolved.defaultProps, ...attributes };
            return {
                kind: 'component',
                name,
                props: mergedProps,
                hydrate,
                id: node.id,
                children: [],
            };
        },
        unknown: async (n) => ({
            kind: 'element',
            tag: 'div',
            props: { 'data-unknown-type': n.props.originalType },
            children: [{ kind: 'text', value: `Unknown node type: ${n.props.originalType}` }],
        }),
    };
    Object.assign(defaultMap, map);
    return defaultMap;
}
