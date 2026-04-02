---
title: Components
description: Interactive React components embedded in Markdown via directives
tags: [components, react, interactive]
order: 2
---

# Components

Embed interactive React components directly in your Markdown using the directive syntax.

## Directive Syntax

Use `:::name` for block components and `:name` for inline ones:

```markdown
:::counter{initial=5}
Optional slot content passed as children.
:::
```

## Registering Components

Add components to `docvia.config.ts`:

```typescript
export default defineConfig({
    components: {
        counter: {
            path: './components/Counter',
            hydrate: true,        // enables client-side hydration
            defaultProps: { initial: 0 },
        },
    },
});
```

## Hydration Modes

| Directive | When it hydrates |
|---|---|
| `hydrate: false` | Server-rendered only, no client JS |
| `hydrate: true` (default) | `client:load` — immediately on page load |
| `client:idle` | After browser is idle (`requestIdleCallback`) |
| `client:visible` | When the element scrolls into view |

## The `components` Prop

`DocviaContent` accepts a `components` prop for tag-level overrides:

```tsx
<DocviaContent
    nodes={page.content}
    registry={registry}
    components={{
        // next/link for client-side navigation
        a: ({ href, children, ...props }) => (
            <Link href={href ?? '/'} {...props}>{children}</Link>
        ),
        // next/image for optimised images
        img: ({ src, alt, ...props }) => (
            <Image src={src!} alt={alt ?? ''} {...props} />
        ),
        // Custom code block with copy button
        codeBlock: ({ html, className }) => (
            <div className={className}>
                <button onClick={() => navigator.clipboard.writeText(html)}>
                    Copy
                </button>
                <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        ),
    }}
/>
```

## Live Counter Example

The counter below is a `'use client'` React component embedded via a directive:

:::counter{initial=42}
:::

The page is fully server-rendered. React hydrates the Counter island automatically since `Counter.tsx` carries the `'use client'` directive.

## Code Highlighting

docvia uses [shiki](https://shiki.style) for syntax highlighting. Code blocks are compiled at build time — no client-side parsing.

```typescript
import { DocviaContent } from '@docvia/renderer-react';
import type { RenderOutput } from '@docvia/renderer-core';

interface Props {
    nodes: RenderOutput | RenderOutput[];
}

// Server Component — no 'use client' needed
export function DocPage({ nodes }: Props) {
    return (
        <article className="prose">
            <DocviaContent nodes={nodes} />
        </article>
    );
}
```

## Tables

| Feature | Svelte renderer | React renderer |
|---|---|---|
| SSR | SvelteKit | Next.js App Router |
| Hydration | Svelte `mount` | `hydrateRoot` / `createRoot` |
| RSC support | No | Yes (no `'use client'` required) |
| Component overrides | No | Yes (`components` prop) |
| `next/link` integration | No | Yes |
