---
title: "@docvia/ir"
description: "The dependency-light foundation: the Intermediate Representation, shared error system, contract interfaces, and the AST to IR transform."
eyebrow: "Packages"
order: 10
---

`@docvia/ir` is the foundational package of docvia. It defines the framework-agnostic **Intermediate Representation (IR)** that every other package consumes or produces, the shared **error system** (`docviaError`), the **contract interfaces** that bind the compiler, renderers, and plugins together, the canonical `docviaConfig` shape, and the **AST to IR transform** that converts a parsed HAST tree into a normalized `IRDocument`.

This package is intentionally dependency-light. It pulls in only [`github-slugger`](https://github.com/Flet/github-slugger) for stable heading IDs. Everything else in the docvia toolchain depends on `@docvia/ir`, so keeping it small keeps the whole graph fast to install and cheap to typecheck. It carries no runtime dependency on `zod`, `unified`, or any rendering framework.

## Installation

```bash
pnpm add @docvia/ir
```

Requires Node.js `>=20.0.0`. The package ships as ESM only (`"type": "module"`).

## Exports

`@docvia/ir` exposes two entry points. The `.` entry carries the full set of types, the error class, and the transform re-export; the `./transform` subpath is a lighter entry for code that only needs the AST to IR conversion.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.mjs` | All IR types, contract interfaces, the `docviaError` class, the `docviaConfig` shape, and a re-export of `transformToIR`. |
| `./transform` | `./dist/transform.mjs` | `transformToIR` and `normalizeProps`. |

```ts
import { docviaError, transformToIR } from "@docvia/ir";
import type { IRDocument, IRNode, docviaConfig } from "@docvia/ir";

// Lighter subpath when you only need the transform
import { transformToIR, normalizeProps } from "@docvia/ir/transform";
```

## Error system

docvia uses a single error class across every package so that callers can catch one type and branch on a discriminant code.

### `docviaErrorCode`

A string-literal union identifying which subsystem raised the failure.

| Code | Raised when |
| --- | --- |
| `SCHEMA_ERROR` | Frontmatter is malformed or fails validation. |
| `PARSE_ERROR` | Markdown parsing or source-tree reading fails. |
| `TRANSFORM_ERROR` | The AST to IR transform fails. |
| `RENDER_ERROR` | A renderer adapter fails to produce output. |
| `PLUGIN_ERROR` | A plugin is invalid or throws inside a lifecycle hook. |
| `CONFIG_ERROR` | The config file cannot be loaded or is not an object. |
| `ASSET_ERROR` | An asset cannot be resolved or emitted. |

### `class docviaError`

```ts
class docviaError extends Error {
  readonly name: "docviaError";
  constructor(
    code: docviaErrorCode,
    message: string,
    file?: string,
    loc?: { readonly line: number; readonly column: number },
    cause?: Error,
  );
}
```

| Field | Type | Description |
| --- | --- | --- |
| `code` | `docviaErrorCode` | Discriminant identifying the failing subsystem. Readonly. |
| `message` | `string` | Human-readable description (inherited from `Error`). |
| `file` | `string \| undefined` | Absolute or relative path of the file being processed, when known. Readonly. |
| `loc` | `{ line: number; column: number } \| undefined` | Source location of the failure, when known. Readonly. |
| `cause` | `Error \| undefined` | The underlying error that triggered this one, for stack chaining. Readonly. |
| `name` | `"docviaError"` | Always the literal string `"docviaError"`. |

```ts
import { docviaError } from "@docvia/ir";

try {
  // ...some docvia operation
} catch (err) {
  if (err instanceof docviaError) {
    console.error(`[${err.code}] ${err.message}`);
    if (err.file) console.error(`  in ${err.file}`);
  }
}
```

## IR node model

The IR is a tree of `IRNode` values. It is deliberately framework-agnostic: renderers (`@docvia/renderer-react`, `@docvia/renderer-svelte`, etc.) translate this tree into framework-specific output.

### `IRNodeType`

The closed set of node types a tree may contain.

| Type | Meaning |
| --- | --- |
| `heading` | A heading (`h1` to `h6`); `props.depth` carries the level. |
| `paragraph` | A block of inline content. |
| `text` | A plain text leaf; `props.value` holds the string. |
| `emphasis` | Emphasized (italic) inline content. |
| `strong` | Strong (bold) inline content. |
| `code-block` | A fenced code block; carries `lang`, `value`, `meta`. |
| `inline-code` | Inline code span; `props.value` holds the string. |
| `link` | A hyperlink; carries `href` and optional `title`. |
| `image` | An image; carries `src`, `alt`, optional `title`. |
| `list` | An ordered or unordered list; `props.ordered` distinguishes them. |
| `list-item` | A single list entry. |
| `table` | A GFM table. |
| `table-row` | A table row. |
| `table-cell` | A table cell; `props.tag` is `"th"` or `"td"`. |
| `blockquote` | A blockquote. |
| `thematic-break` | A horizontal rule. |
| `component` | A block-level component instance (from a container directive). |
| `component-inline` | An inline component instance (from a leaf directive). |
| `element` | A generic, framework-agnostic HTML element passthrough. |
| `unknown` | Reserved fallback for unrecognized input. |

### `HydrationMode`

```ts
type HydrationMode = "none" | "client:load" | "client:idle" | "client:visible";
```

Declares when a component node should hydrate on the client. `none` keeps the component static (server-rendered only); `client:load` hydrates immediately; `client:idle` defers to the browser's idle callback; `client:visible` hydrates when the element scrolls into view.

### `IRNode`

```ts
interface IRNode {
  readonly type: IRNodeType;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly IRNode[];
  readonly id?: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `type` | `IRNodeType` | The node's kind. |
| `props` | `Readonly<Record<string, unknown>>` | Normalized attributes. Class names are stored under `class` (never `className`); `style` is an inline string, never an object. |
| `children` | `readonly IRNode[]` | Child nodes. Leaf nodes (`text`, `code-block`, `inline-code`, `image`, `component-inline`) have an empty array. |
| `id` | `string \| undefined` | Stable per-node ID (`node-0`, `node-1`, …) assigned during transform; used as a hydration anchor. |

## Dependency and metadata types

### `Dependency`

A discriminated union describing an external resource a document references. Used by the compiler for incremental rebuilds and asset emission.

```ts
type Dependency =
  | { readonly type: "file"; readonly path: string }
  | { readonly type: "asset"; readonly path: string }
  | { readonly type: "component"; readonly name: string };
```

| Variant | Fields | Source |
| --- | --- | --- |
| `file` | `path` | A relative link to another `.md` document. |
| `asset` | `path` | A relative image reference. |
| `component` | `name` | A directive-based component instance. |

For `file` and `asset` dependencies, `path` is resolved against the document's directory and normalized to forward slashes.

### `HeadingMeta`

```ts
interface HeadingMeta {
  readonly depth: number;
  readonly text: string;
  readonly id: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `depth` | `number` | Heading level, `1` to `6`. |
| `text` | `string` | The heading's plain-text content. |
| `id` | `string` | Slugified, collision-free anchor ID. |

### `FrontmatterData`

The validated frontmatter shape attached to every document.

```ts
interface FrontmatterData {
  readonly title: string;
  readonly description: string;
  readonly slug?: string;
  readonly tags: readonly string[];
  readonly draft?: boolean;
  readonly order?: number;
  readonly [key: string]: unknown;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Page title. Required. |
| `description` | `string` | Page description. Defaults to an empty string. |
| `slug` | `string \| undefined` | Explicit slug override; bypasses slug computation. |
| `tags` | `readonly string[]` | Tag list. Defaults to an empty array. |
| `draft` | `boolean \| undefined` | Marks the page as a draft. |
| `order` | `number \| undefined` | Sort hint for navigation. |
| `[key: string]` | `unknown` | Arbitrary extra fields validated by an extension schema. |

## Document and page types

### `IRDocument`

The complete compiled representation of one source file.

```ts
interface IRDocument {
  readonly slug: string;
  readonly frontmatter: FrontmatterData;
  readonly children: readonly IRNode[];
  readonly headings: readonly HeadingMeta[];
  readonly dependencies: readonly Dependency[];
  readonly contentHash: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | The page's route slug. |
| `frontmatter` | `FrontmatterData` | Validated frontmatter. |
| `children` | `readonly IRNode[]` | The IR node tree for the document body. |
| `headings` | `readonly HeadingMeta[]` | All headings in document order, for tables of contents. |
| `dependencies` | `readonly Dependency[]` | Deduplicated file, asset, and component references. |
| `contentHash` | `string` | Composite content hash. Left empty by `transformToIR`; the compiler fills it in with config and dependency inputs. |

### `PageMeta`

A lightweight metadata record describing a compiled page, without the node tree.

```ts
interface PageMeta {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly headings: readonly HeadingMeta[];
  readonly contentHash: string;
  readonly lastModified: number;
  readonly tags: readonly string[];
  readonly order?: number;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | Route slug. |
| `title` | `string` | Page title (from frontmatter). |
| `description` | `string` | Page description. |
| `headings` | `readonly HeadingMeta[]` | Heading metadata. |
| `contentHash` | `string` | Composite content hash. |
| `lastModified` | `number` | Unix-millisecond timestamp of the build. |
| `tags` | `readonly string[]` | Tags from frontmatter. |
| `order` | `number \| undefined` | Optional sort hint. |

## Renderer contract

### `RenderedPage`

The output a `RendererAdapter` produces for one page.

```ts
interface RenderedPage {
  readonly slug: string;
  readonly code: string;
  readonly contentHash: string;
  readonly map?: RawSourceMap;
  readonly assets?: readonly AssetReference[];
  readonly imports?: readonly string[];
}
```

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | The rendered page's slug. |
| `code` | `string` | Generated module source code. |
| `contentHash` | `string` | Carries through from the `IRDocument`. |
| `map` | `RawSourceMap \| undefined` | Optional source map for `code`. |
| `assets` | `readonly AssetReference[] \| undefined` | Assets the renderer emitted. |
| `imports` | `readonly string[] \| undefined` | Module specifiers the generated code imports. |

### `RawSourceMap`

A standard V3 source-map object: `version`, `sources`, `names`, `mappings`, plus optional `file`, `sourceRoot`, and `sourcesContent`.

### `AssetReference`

```ts
interface AssetReference {
  readonly originalPath: string;
  readonly emittedPath: string;
  readonly hash: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `originalPath` | `string` | Path of the asset in the source tree. |
| `emittedPath` | `string` | Path the asset was emitted to. |
| `hash` | `string` | Content hash of the asset. |

### `RendererAdapter`

The interface a rendering backend must implement.

```ts
interface RendererAdapter {
  readonly name: string;
  renderPage(doc: IRDocument): Promise<RenderedPage>;
  renderManifest(pages: readonly PageMeta[]): Promise<string>;
}
```

| Member | Signature | Description |
| --- | --- | --- |
| `name` | `string` | Adapter identifier, e.g. `"react"`. |
| `renderPage` | `(doc: IRDocument) => Promise<RenderedPage>` | Renders one document into a module. |
| `renderManifest` | `(pages: readonly PageMeta[]) => Promise<string>` | Renders a manifest module covering all pages. |

## Compiler contract

### `FileEntry`

A single source file read from disk.

```ts
interface FileEntry {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
  readonly hash: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `path` | `string` | Absolute path to the file. |
| `relativePath` | `string` | Path relative to the source directory, forward-slashed. |
| `content` | `string` | Raw file contents. |
| `hash` | `string` | Hash of the file contents. |

### `CompilerOptions`

```ts
interface CompilerOptions {
  readonly sourceDir: string;
  readonly outDir: string;
  readonly renderer: RendererAdapter;
  readonly plugins: readonly docviaPlugin[];
  readonly config: docviaConfig;
  readonly projectRoot?: string;
  readonly incremental?: boolean;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `sourceDir` | `string` | Directory containing markdown sources. |
| `outDir` | `string` | Directory the generated module graph is written to. |
| `renderer` | `RendererAdapter` | The rendering backend. |
| `plugins` | `readonly docviaPlugin[]` | Plugins to run through the pipeline. |
| `config` | `docviaConfig` | The resolved configuration object. |
| `projectRoot` | `string \| undefined` | Root for resolving relative paths and emitting `docvia-env.d.ts`. Defaults to `process.cwd()`. |
| `incremental` | `boolean \| undefined` | When `true` (default), uses the on-disk cache; pass `false` to force a full rebuild. |

### `CompileResult`

```ts
interface CompileResult {
  readonly pages: readonly PageMeta[];
  readonly searchIndex?: string;
  readonly duration: number;
  readonly stats: {
    readonly total: number;
    readonly compiled: number;
    readonly cached: number;
  };
}
```

| Field | Type | Description |
| --- | --- | --- |
| `pages` | `readonly PageMeta[]` | Metadata for every compiled page. |
| `searchIndex` | `string \| undefined` | Optional serialized search index. |
| `duration` | `number` | Wall-clock build time in milliseconds. |
| `stats.total` | `number` | Total source files discovered. |
| `stats.compiled` | `number` | Files compiled fresh this run. |
| `stats.cached` | `number` | Files served from the incremental cache. |

## Plugin contract

### `HookPhase`

```ts
type HookPhase = "pre" | "normal" | "post";
```

Plugins run in phase order: all `pre` plugins, then all `normal`, then all `post`. Within a phase, `priority` breaks the tie. The default phase is `normal`.

### `docviaPlugin`

```ts
interface docviaPlugin {
  readonly name: string;
  readonly version: string;
  readonly phase?: HookPhase;
  readonly priority?: number;
  cacheKey?(): string;
  beforeParse?(file: FileEntry): Promise<FileEntry> | FileEntry;
  afterParse?(ast: unknown, file: FileEntry): Promise<unknown> | unknown;
  beforeTransform?(ast: unknown, meta: FrontmatterData): Promise<unknown> | unknown;
  afterTransform?(doc: IRDocument): Promise<IRDocument> | IRDocument;
  beforeRender?(doc: IRDocument): Promise<IRDocument> | IRDocument;
}
```

| Member | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique plugin name. Required. |
| `version` | `string` | Plugin version. Required. |
| `phase` | `HookPhase \| undefined` | Pipeline phase. Defaults to `"normal"`. |
| `priority` | `number \| undefined` | Tie-breaker within a phase; lower runs first. Defaults to `100`. |
| `cacheKey` | `() => string` | Returns a string folded into the build cache key. |
| `beforeParse` | hook | Runs on the raw `FileEntry` before markdown parsing. |
| `afterParse` | hook | Runs on the parsed AST. |
| `beforeTransform` | hook | Runs on the AST just before the IR transform. |
| `afterTransform` | hook | Runs on the `IRDocument` after the transform. |
| `beforeRender` | hook | Runs on the `IRDocument` just before rendering. |

## Config types

### `ComponentConfig`

```ts
interface ComponentConfig {
  readonly path: string;
  readonly hydrate?: boolean;
  readonly defaultProps?: Record<string, unknown>;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `path` | `string` | Module path to the component. |
| `hydrate` | `boolean \| undefined` | Whether the component hydrates on the client. |
| `defaultProps` | `Record<string, unknown> \| undefined` | Props merged into every instance. |

### `CollectionConfig`

```ts
interface CollectionConfig {
  readonly name: string;
  readonly sourceDir: string;
  readonly baseUrl?: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Collection identifier. |
| `sourceDir` | `string` | Source directory for the collection. |
| `baseUrl` | `string \| undefined` | URL prefix for the collection's routes. |

### `FrontmatterSchema`

A duck-typed interface compatible with `z.ZodObject<any>`. It is defined here so `@docvia/ir` can describe the `frontmatter` config field without depending on `zod`. It exposes a `safeParse(data)` method returning a success/error result and a readonly `shape` record.

### `docviaConfig`

The resolved configuration object consumed across the toolchain.

```ts
interface docviaConfig {
  readonly sourceDir: string;
  readonly outDir: string;
  readonly plugins: readonly docviaPlugin[];
  readonly renderer?: RendererAdapter;
  readonly components?: Record<string, ComponentConfig>;
  readonly collections?: readonly CollectionConfig[];
  readonly frontmatter?: FrontmatterSchema;
  readonly markdown: { readonly remarkPlugins: readonly unknown[] };
  readonly syntax: {
    readonly highlighter: "shiki" | "prism";
    readonly theme: string;
    readonly langs: readonly string[];
  };
  readonly theme: {
    readonly name: string;
    readonly options: Readonly<Record<string, unknown>>;
  };
}
```

| Field | Type | Description |
| --- | --- | --- |
| `sourceDir` | `string` | Default markdown source directory. |
| `outDir` | `string` | Output directory for the generated module graph. |
| `plugins` | `readonly docviaPlugin[]` | Configured plugins. |
| `renderer` | `RendererAdapter \| undefined` | Rendering backend. |
| `components` | `Record<string, ComponentConfig> \| undefined` | Component registry, keyed by directive name. |
| `collections` | `readonly CollectionConfig[] \| undefined` | Named content collections. |
| `frontmatter` | `FrontmatterSchema \| undefined` | Zod schema extending the base frontmatter validation. |
| `markdown.remarkPlugins` | `readonly unknown[]` | User remark plugins inserted into the parse pipeline. |
| `syntax.highlighter` | `"shiki" \| "prism"` | Syntax highlighter backend. |
| `syntax.theme` | `string` | Highlighter theme name. |
| `syntax.langs` | `readonly string[]` | Languages to preload. |
| `theme.name` | `string` | Site theme name. |
| `theme.options` | `Readonly<Record<string, unknown>>` | Theme-specific options. |

## The AST to IR transform

### `transformToIR`

```ts
function transformToIR(
  ast: HastRoot,
  frontmatter: FrontmatterData,
  filePath: string,
): IRDocument
```

Available from both `@docvia/ir` and `@docvia/ir/transform`. It walks a HAST (HTML AST) tree and produces a normalized `IRDocument`.

During the walk it:

- **Normalizes props.** Runs every element's attributes through `normalizeProps` so `className` becomes `class` and `style` objects become inline strings.
- **Collects headings.** Records each `h1` to `h6` with its depth, plain text, and a collision-free slug generated by `github-slugger`.
- **Collects dependencies.** Relative `.md` links become `file` dependencies, relative image `src` values become `asset` dependencies, and directives become `component` dependencies. Duplicates are removed.
- **Drops blocked tags.** `script`, `iframe`, `object`, and `embed` elements are silently removed for security.
- **Maps directives to component nodes.** Container directives become `component` nodes, leaf directives become `component-inline` nodes. Directive attributes (passed through as `data-prop-*` attributes) are decoded, type-coerced, and a `hydrate` value is extracted.
- **Maps semantic tags.** Known HTML tags (`p`, `ul`, `a`, `img`, `strong`, etc.) become their semantic IR node types; unrecognized tags fall through to a generic `element` node.
- **Assigns stable IDs.** Every node gets a sequential `node-N` id for hydration anchoring.
- **Computes the slug.** See `computeSlug` below.

The returned `IRDocument.contentHash` is left as an empty string; the compiler computes the real composite hash later.

### `normalizeProps`

```ts
function normalizeProps(
  properties?: Record<string, unknown>,
): Record<string, unknown>
```

Available from `@docvia/ir/transform`. Enforces the IR prop contract:

- `null` and `undefined` values are dropped.
- `className` (a string or HAST string array) is joined and re-emitted as `class`.
- A `style` object is flattened to a `key:value;key:value` inline string.
- All other keys pass through unchanged.

### Slug computation

`transformToIR` derives the document slug with the following rules. If `frontmatter.slug` is set, it is used verbatim. Otherwise the file path is transformed:

- Backslashes are converted to forward slashes.
- A trailing `.md` extension is stripped.
- A trailing `/index` segment is stripped.
- If the result is empty, the slug becomes `"index"`.

So `guide/intro.md` yields `guide/intro`, `guide/index.md` yields `guide`, and `index.md` yields `index`.

## Usage example

```ts
import { parseMarkdown } from "@docvia/core";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import { transformToIR, docviaError } from "@docvia/ir";
import type { IRDocument } from "@docvia/ir";

async function buildDocument(
  rawSource: string,
  relativePath: string,
): Promise<IRDocument> {
  try {
    const { data, content } = extractFrontmatter(rawSource);
    const frontmatter = validateFrontmatter(data, relativePath);
    const { ast } = await parseMarkdown(content);
    return transformToIR(ast, frontmatter, relativePath);
  } catch (err) {
    if (err instanceof docviaError) {
      throw new Error(`[${err.code}] ${relativePath}: ${err.message}`);
    }
    throw err;
  }
}
```
