---
title: "@docvia/renderer-core"
description: "The framework-agnostic rendering engine that walks a parsed IR document into a serializable RenderOutput tree."
eyebrow: "Packages"
order: 20
---

`@docvia/renderer-core` is the heart of docvia's rendering pipeline. It takes a parsed `IRDocument` (produced by `@docvia/ir`) and walks it into a **serializable `RenderOutput` tree** — a plain JSON structure made of `element`, `text`, `html`, `component`, and `fragment` nodes. It has **no dependency on React, Svelte, or the DOM**, which is what allows every framework adapter to build on a single shared core.

The package also ships a default renderer map covering all standard markdown node types, a structured `RenderError` class, and a generic island `hydrate()` helper. It depends only on `@docvia/ir`.

## Why a framework-agnostic core

Every docvia framework adapter (`@docvia/renderer-react`, `@docvia/renderer-svelte`, and any future adapter) shares the same job: traverse the IR, highlight code, resolve components, and emit something a renderer can consume. `renderer-core` factors that shared work into one place.

The output is intentionally **pure data**. A `RenderOutput` tree contains no functions, no class instances, and no framework primitives — only JSON-serializable values. This means a compiled page can be:

- serialized to a JS module at build time,
- transmitted over the wire,
- and re-rendered by any adapter on any runtime (RSC, SSR, browser).

## Installation

```bash
npm install @docvia/renderer-core
```

`@docvia/ir` is a required peer of the rendering pipeline and is normally already present in a docvia project.

## Exports

This package exposes a single entry point.

| Subpath | Purpose |
| --- | --- |
| `.` | The complete public API. Re-exports the default renderer map, the `RenderError` class, the generic `hydrate()` helper, the `renderDocument`/`renderNodes` functions, and all rendering types. |

```ts
import {
  createDefaultRendererMap,
  renderDocument,
  renderNodes,
  hydrate,
  RenderError,
  type RenderOutput,
  type RenderContext,
  type RenderResult,
  type RendererMap,
  type NodeRenderer,
  type ComponentRegistry,
  type SyntaxHighlighter,
  type HydrationManifest,
  type HydrationEntry,
} from "@docvia/renderer-core";
```

## The RenderOutput tree

`RenderOutput` is the discriminated union every node of the rendered tree belongs to. The `kind` field is the discriminant.

```ts
type RenderOutput =
  | {
      kind: "element";
      tag: string;
      props?: Record<string, unknown>;
      children?: RenderOutput[];
      id?: string;
    }
  | { kind: "text"; value: string }
  | { kind: "html"; value: string }
  | {
      kind: "component";
      name: string;
      props?: Record<string, unknown>;
      children?: RenderOutput[];
      hydrate?: HydrationMode;
      id: string;
    }
  | { kind: "fragment"; children: RenderOutput[] };
```

| Kind | Meaning |
| --- | --- |
| `element` | A host HTML element. `tag` is the tag name, `props` carry attributes (including `class`), `children` are nested outputs, and `id` — when present — is the hydration anchor copied to `data-hid`. |
| `text` | A literal text run. `value` is rendered verbatim. |
| `html` | A raw HTML string, e.g. syntax-highlighted code emitted by the highlighter. Adapters inject this directly (React via `dangerouslySetInnerHTML`, Svelte via `{@html}`). |
| `component` | An interactive or directive component. `name` resolves through the `ComponentRegistry`, `id` is the mandatory hydration anchor, and `hydrate` declares the island strategy. |
| `fragment` | A transparent wrapper holding a list of children with no host element of its own. The root of a rendered document is always a `fragment`. |

> The `id` field on `element` is optional, but on `component` it is **required** — every component island must have a stable id so the hydration manifest can locate its `[data-hid]` anchor in the DOM.

## Core interfaces and types

### RenderContext

The context object threaded through every renderer call. It carries everything a `NodeRenderer` needs.

```ts
interface RenderContext {
  readonly slug: string;
  readonly meta: PageMeta;
  readonly registry: ComponentRegistry;
  readonly highlighter?: SyntaxHighlighter;
  readonly manifest: HydrationManifest;
  readonly onError?: (err: RenderError) => void;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | The slug of the page currently being rendered. |
| `meta` | `PageMeta` | Page metadata (title, description, headings, tags, order, content hash) from `@docvia/ir`. |
| `registry` | `ComponentRegistry` | Resolver used to look up custom components by name. |
| `highlighter` | `SyntaxHighlighter` (optional) | Optional render-time highlighter, consulted only as a fallback for code blocks not already pre-highlighted by a build-time plugin. When omitted, such blocks render as plain `<pre>`. |
| `manifest` | `HydrationManifest` | The mutable array that hydratable components are pushed onto during the walk. |
| `onError` | `(err: RenderError) => void` | Optional callback invoked for every render error instead of throwing. |

`renderDocument` accepts an `Omit<RenderContext, "manifest">` and creates the `manifest` internally — callers never construct the manifest themselves.

### NodeRenderer and RendererMap

```ts
type NodeRenderer = (node: IRNode, ctx: RenderContext) => Promise<RenderOutput>;

interface RendererMap {
  [K: string]: NodeRenderer;
}
```

A `RendererMap` maps an IR node `type` string to the async function that turns that node into a `RenderOutput`. The key **`unknown`** is special: it is the fallback used whenever no renderer is registered for a node's `type`.

### ComponentRegistry

```ts
interface ComponentRegistry {
  resolve(name: string):
    | { component: unknown; hydrate?: boolean; defaultProps?: Record<string, unknown> }
    | null;
}
```

The registry resolves a component name to a framework component reference. `component` is typed as `unknown` deliberately — the core never touches the actual component, keeping it framework-agnostic. `resolve` returns `null` for an unknown name. `defaultProps` are merged underneath the directive's own attributes by the default `component` renderer.

### SyntaxHighlighter

```ts
interface SyntaxHighlighter {
  highlight(code: string, lang: string): Promise<{ html: string }>;
}
```

A minimal contract for code highlighting. Highlighting is normally a build-time plugin ([`@docvia/plugin-shiki`](/docs/packages/plugin-shiki)) that bakes highlighted HTML onto `code-block` nodes; the `SyntaxHighlighter` contract is only used for an optional render-time fallback.

### HydrationEntry and HydrationManifest

```ts
interface HydrationEntry {
  id: string;
  name: string;
  props: Record<string, unknown>;
  hydrate: HydrationMode;
}

type HydrationManifest = HydrationEntry[];
```

The manifest is the build-time list of interactive islands on a page. Each entry records the anchor `id`, the component `name` to resolve, the `props` to pass, and the `hydrate` mode (`HydrationMode` from `@docvia/ir` — `"client:load"`, `"client:idle"`, `"client:visible"`, or `"none"`).

### RenderResult

```ts
interface RenderResult {
  output: RenderOutput;
  manifest: HydrationManifest;
}
```

The return value of `renderDocument`. `output` is always a `fragment` rooting the page; `manifest` lists every hydratable component discovered during the walk.

## RenderError

```ts
class RenderError extends Error {
  constructor(code: string, message: string, node: IRNode);
  readonly code: string;
  readonly node: IRNode;
  name = "RenderError";
}
```

A structured error carrying the failing IR `node` and a machine-readable `code`. Codes currently emitted by the core:

| Code | Raised when |
| --- | --- |
| `UNKNOWN_NODE` | A renderer threw a non-`RenderError` exception; the original error is wrapped with this code. |
| `HIGHLIGHT_ERROR` | The `code-block` renderer's call to the highlighter failed. |

Render errors do not abort the walk. When a renderer throws, `renderNodes` catches it, routes it to `ctx.onError`, and substitutes an inline error element:

```ts
{
  kind: "element",
  tag: "div",
  props: { class: "docvia-render-error" },
  children: [{ kind: "text", value: "Render error: <message>" }],
}
```

## API reference

### createDefaultRendererMap()

```ts
function createDefaultRendererMap(): RendererMap;
```

Builds a `RendererMap` covering every standard IR node type. The returned map handles:

`paragraph`, `heading`, `text`, `emphasis`, `strong`, `code-block`, `inline-code`, `image`, `link`, `list`, `list-item`, `table`, `table-row`, `table-cell`, `blockquote`, `thematic-break`, `component`, `component-inline`, `element`, and `unknown` (the fallback).

Notable behaviours:

- **`heading`** emits `h1`–`h6` from `node.props.depth` and copies `node.props.id` so anchored links work.
- **`code-block`** emits a node's pre-highlighted `props.html` directly when present (set by a build-time plugin such as `@docvia/plugin-shiki`). Otherwise, if `ctx.highlighter` is set, it calls `highlight()` and wraps the result in `<div class="docvia-code-block">`; if no highlighter is configured, it emits a plain `<pre><code>` block. A failing highlight call reports a `HIGHLIGHT_ERROR` and falls back to a plain `<pre>`.
- **`list`** emits `ol` (carrying `start`) or `ul` based on `node.props.ordered`.
- **`table-cell`** emits `th` or `td` based on `node.props.tag`.
- **`component`** and **`component-inline`** resolve the name through the registry, merge `defaultProps` under the directive attributes, read the `hydrate` mode (defaulting to `"none"`), and emit a `component` output. `component-inline` always has empty children.
- **`unknown`** emits a `<div data-unknown-type="…">` placeholder rather than throwing.

The map is self-referential — every renderer recurses through the same map, so a custom map can be built by spreading the default and overriding individual keys.

### renderDocument()

```ts
function renderDocument(
  doc: IRDocument,
  map: RendererMap,
  ctx: Omit<RenderContext, "manifest">,
): Promise<RenderResult>;
```

The top-level entry point. It creates a fresh `HydrationManifest`, completes the `RenderContext`, walks `doc.children`, and returns a `RenderResult` whose `output` is a `fragment` rooting the page. This is the function build-time adapters call once per document.

### renderNodes()

```ts
function renderNodes(
  nodes: readonly IRNode[],
  map: RendererMap,
  ctx: RenderContext,
): Promise<RenderOutput[]>;
```

Renders a list of sibling nodes. Used internally by `renderDocument` and by individual renderers to recurse into children. Key behaviours:

- **Concurrent** — all siblings are rendered with `Promise.all`; they have no ordering dependency.
- **Error isolation** — a throwing renderer is caught, wrapped in a `RenderError`, routed to `ctx.onError`, and replaced by an inline error element. One bad node never breaks the page.
- **Manifest collection** — after all renders settle, any `component` output with a `hydrate` mode other than `"none"` is pushed onto `ctx.manifest` in document order.

### hydrate()

```ts
function hydrate(
  manifest: HydrationManifest,
  registry: ComponentRegistry,
): Promise<void>;
```

A **generic, Svelte-style island hydration** helper. It walks the manifest and mounts each interactive component at its `[data-hid]` anchor.

- No-ops immediately when `window` is undefined (server / build).
- Honours each entry's `hydrate` mode:
  - `client:load` — hydrate immediately.
  - `client:idle` — hydrate on `requestIdleCallback` (with a `setTimeout(…, 200)` fallback).
  - `client:visible` — hydrate when the anchor scrolls into view via `IntersectionObserver`.
- **Idempotent** — every hydrated id is tracked in a module-level set, so repeated calls never double-mount.
- Instantiates the resolved component with `new Component({ target, props, hydrate: true })`, the Svelte-component calling convention.

> This helper assumes the Svelte component instantiation API. The React adapter ships its own DOM-aware `hydrate()` in `@docvia/renderer-react/client` that uses `hydrateRoot`/`createRoot` instead.

## Usage

### Rendering a document with the default map

```ts
import {
  createDefaultRendererMap,
  renderDocument,
  type ComponentRegistry,
  type SyntaxHighlighter,
} from "@docvia/renderer-core";
import type { IRDocument } from "@docvia/ir";

const registry: ComponentRegistry = {
  resolve: () => null, // no custom components
};

const highlighter: SyntaxHighlighter = {
  async highlight(code) {
    return { html: `<pre><code>${code}</code></pre>` };
  },
};

async function render(doc: IRDocument) {
  const { output, manifest } = await renderDocument(
    doc,
    createDefaultRendererMap(),
    {
      slug: doc.slug,
      meta: {
        slug: doc.slug,
        title: doc.frontmatter.title,
        description: doc.frontmatter.description,
        headings: doc.headings,
        contentHash: doc.contentHash,
        lastModified: Date.now(),
      },
      registry,
      highlighter,
      onError: (err) => console.error(err.code, err.message),
    },
  );

  return { output, manifest };
}
```

### Extending the renderer map

Because the default map is self-referential, you can override one node type while keeping the rest of the pipeline intact:

```ts
import { createDefaultRendererMap, type RendererMap } from "@docvia/renderer-core";

function createCustomMap(): RendererMap {
  const map = createDefaultRendererMap();

  // Wrap every blockquote in a callout element.
  const base = map.blockquote;
  map.blockquote = async (node, ctx) => {
    const out = await base(node, ctx);
    return {
      kind: "element",
      tag: "aside",
      props: { class: "callout" },
      children: [out],
    };
  };

  return map;
}
```

### Consuming the output in an app

The `RenderOutput` tree is plain JSON, so any framework can walk it. A minimal consumer:

```ts
import type { RenderOutput } from "@docvia/renderer-core";

function toHtml(node: RenderOutput): string {
  switch (node.kind) {
    case "text":
      return node.value;
    case "html":
      return node.value;
    case "fragment":
      return node.children.map(toHtml).join("");
    case "element": {
      const inner = (node.children ?? []).map(toHtml).join("");
      return `<${node.tag}>${inner}</${node.tag}>`;
    }
    case "component":
      return `<div data-hid="${node.id}"></div>`;
  }
}
```

In practice you would use `@docvia/renderer-react` or `@docvia/renderer-svelte`, which provide complete, hydration-aware renderers for the same tree.
