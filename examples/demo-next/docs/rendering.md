---
title: Rendering
description: Render documentation content with Renderer, component overrides, and the component registry.
order: 3
---

# Rendering

Docvia compiles Markdown into a `RenderOutput` tree. `page.data.load()` returns it as `content`, and the `Renderer` component renders it in your React application.

## Basic usage

```tsx
import { Renderer } from "@docvia/core/react";
import { source } from "@/lib/source";

export default async function Page() {
  const page = source.getPage(["getting-started"]);
  if (!page) notFound();
  const { content } = await page.data.load();

  return <Renderer nodes={content} />;
}
```

`Renderer` is a React Server Component. No client-side JavaScript is shipped unless your content contains interactive components.

## Component overrides

Override how HTML elements are rendered using the `components` prop:

```tsx
<Renderer
  nodes={content}
  components={{
    a: ({ href, children, ...props }) => (
      <Link href={href ?? "/"} {...props}>{children}</Link>
    ),
    img: ({ src, alt, ...props }) => (
      <Image src={src ?? ""} alt={alt ?? ""} width={800} height={400} {...props} />
    ),
  }}
/>
```

### Available overrides

| Key | Element | Use case |
| --- | --- | --- |
| `a` | `<a>` | Client-side navigation with `next/link` |
| `img` | `<img>` | Image optimization with `next/image` |
| `codeBlock` | Code blocks | Custom code block with copy button, line numbers |

### Code block override

The `codeBlock` override receives pre-rendered Shiki HTML:

```tsx
components={{
  codeBlock: ({ html, className }) => (
    <div className={className}>
      <button onClick={() => navigator.clipboard.writeText(/* ... */)}>
        Copy
      </button>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  ),
}}
```

## Component registry

For interactive components embedded in Markdown via directives, pass a `registry`:

```tsx
import { registry } from "@/lib/registry";

<Renderer
  nodes={content}
  registry={registry}
/>
```

The registry resolves directive component names (like `:::counter`) to actual React components. `defineRegistry()` in `lib/registry.ts` builds it from the `components` field in your `docvia.config.ts`.

You can also pass a custom registry to override the global one:

```tsx
const customRegistry = {
  resolve(name) {
    if (name === "chart") return { component: MyChart };
    return registry.resolve(name);
  },
};

<Renderer nodes={content} registry={customRegistry} />
```

## Hydration

When a page contains interactive components, the `manifest` from `page.data.load()` describes which components need client-side hydration:

```tsx
import { DocviaHydrator } from "./DocviaHydrator";

const { content, manifest } = await page.data.load();

{manifest.length > 0 && <DocviaHydrator manifest={manifest} />}
```

`hydrate()` also makes tabbed code groups (`tab="..."` fences, `:::code-group`, `npm` fences) switch. On pages without islands, call `installCodeGroups()` from `@docvia/core/react/client` in a client component instead.

See [Components](/docs/components) for hydration modes and directive syntax.

## RenderOutput types

The compiled output is a tree of typed nodes:

| Kind | Description |
| --- | --- |
| `element` | HTML element (`div`, `p`, `h2`, ...) |
| `text` | Plain text content |
| `html` | Raw HTML (syntax-highlighted code) |
| `component` | Interactive component placeholder |
| `fragment` | Grouping node with children |
