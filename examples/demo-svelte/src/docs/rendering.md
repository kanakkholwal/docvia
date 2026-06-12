---
title: Rendering
description: Render documentation content with the Svelte Renderer component and component registry.
order: 3
---

# Rendering

Docvia compiles Markdown into a `RenderOutput` tree at build time. The `Renderer` component renders this tree in your Svelte application.

## Basic usage

```svelte
<script>
  import { Renderer } from "@docvia/renderer-svelte";
  let { data } = $props();
</script>

<Renderer nodes={data.page.content} />
```

The Renderer is a Svelte 5 component using runes syntax. No client-side JavaScript is shipped unless your content contains interactive components.

## Component registry

For interactive components embedded via directives, pass a `registry`:

```svelte
<Renderer nodes={data.page.content} registry={registry} />
```

The registry resolves directive names to Svelte components. It is generated from the `components` field in `docvia.config.ts` and exported from `virtual:docvia/source`.

## Renderer props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `RenderOutput \| RenderOutput[]` | Yes | Compiled page content |
| `registry` | `ComponentRegistry` | No | Component resolver for directives |

## RenderOutput types

The compiled output is a tree of typed nodes:

| Kind | Description |
| --- | --- |
| `element` | HTML element (`div`, `p`, `h2`, ...) |
| `text` | Plain text content |
| `html` | Raw HTML (syntax-highlighted code) |
| `component` | Interactive component placeholder |
| `fragment` | Grouping node with children |

## Differences from React

The Svelte renderer does not yet support the `components` prop for tag-level overrides (e.g., replacing `<a>` or `<img>` globally). This is a React-specific feature. In Svelte, customize element rendering by extending the Renderer or post-processing the output tree.
