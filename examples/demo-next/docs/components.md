---
title: Components
description: Embed interactive React components in your Markdown documentation using directives and selective hydration.
order: 4
---

# Components

Docvia supports embedding interactive components directly in Markdown using the directive syntax. Components are registered in your config and hydrated on the client with configurable strategies.

## Directive syntax

Use the remark-directive syntax to embed components:

**Block directive** — renders as a block element with optional children:

```markdown
:::counter{initial=42 hydrate="client:load"}
:::
```

**Inline directive** — renders inline within a paragraph:

```markdown
Check the :badge{text="new"} feature.
```

## Registration

Register components in `docvia.config.ts`:

```typescript
export default defineConfig({
  components: {
    counter: {
      path: "./components/Counter",
      hydrate: true,
      defaultProps: { initial: 0 },
    },
  },
});
```

| Field | Type | Description |
| --- | --- | --- |
| `path` | `string` | Path to the component file |
| `hydrate` | `boolean` | Enable client-side interactivity |
| `defaultProps` | `object` | Default prop values, overridable in Markdown |

## Hydration modes

Docvia supports selective hydration — only interactive components ship JavaScript to the client:

| Mode | When | Use case |
| --- | --- | --- |
| `hydrate: false` | Never | Static content, rendered server-side only |
| `hydrate: true` | Immediate (`client:load`) | Interactive components needed on first paint |
| `client:idle` | On idle | Components loaded after main thread is free |
| `client:visible` | On intersection | Components loaded when scrolled into view |

Set the hydration mode in your directive:

```markdown
:::counter{initial=10 hydrate="client:visible"}
:::
```

## Live example

Here is an interactive counter component embedded via directive:

:::counter{initial=42 hydrate="client:load"}
:::

The counter above is server-rendered, then hydrated on the client. Try clicking the buttons — the component state is fully interactive.

## How it works

1. The directive `:::counter{initial=42}` is parsed into an IR `component` node
2. At build time, the component is rendered to HTML (server-side)
3. The hydration manifest records the component's `id`, `name`, and `props`
4. At runtime, `DocviaHydrator` mounts React on the server-rendered HTML

## Creating components

Components are standard React components. The only requirements:

- Must have a **default export**
- Props are passed from directive attributes
- Children come from the directive body (if block directive)

```tsx
"use client";

import { useState } from "react";

export default function Counter({ initial = 0 }) {
  const [count, setCount] = useState(initial);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```
