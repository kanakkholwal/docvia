---
title: Components
description: Built-in and custom components
tags: [advanced, components]
order: 2
---

# Components

docvia ships with multiple ways to enhance your documentation with interactive components.

## Renderer Component

The core renderer that displays all compiled markdown content:

```svelte
<script>
  import { Renderer } from '@docvia/renderer-svelte';
  import { registry } from 'docvia:source/registry';
  
  export let nodes;
</script>

<Renderer {nodes} registry={registry} />
```

## Custom Components via Directives

Embed interactive components using the directive syntax:

:::note
This is a note component rendered via the directive system.
:::

:::warning
This is a warning — handle with care!
:::

:::info
Information messages help users understand important details.
:::

:::success
This shows a successful operation or achievement.
:::

## Code Examples

TypeScript example with syntax highlighting:

```typescript
interface Config {
  dir: string;
  output: string;
  plugins: Array<Plugin>;
}

function compileMarkdown(input: string): Promise<string> {
  return Promise.resolve(input);
}
```

Svelte component example:

```svelte
<script>
  let count = $state(0);
  
  function increment() {
    count++;
  }
</script>

<button on:click={increment}>
  Count: {count}
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    cursor: pointer;
  }
</style>
```

## Interactive Counter

:::counter{initial=42}
This is an interactive counter component!
:::

## Tables

Feature comparison table:

| Feature | Status | Notes |
|---------|--------|-------|
| Build-time compilation | ✓ | Zero runtime overhead |
| Incremental builds | ✓ | Fast development cycles |
| Search integration | ✓ | Full-text powered by Orama |
| Plugin system | ✓ | Custom renderers support |
| Dark mode | Planned | Theme switching coming soon |

## List Examples

### Ordered Steps

1. Initialize your docvia project
2. Create documentation files
3. Configure your site
4. Deploy to production

### Feature List

- **Fast** — Build-time compilation, instant renders
- **Minimal** — Zero runtime parsing overhead
- **Extensible** — Full plugin system
- **Search-ready** — Built-in full-text search
- **Beautiful** — Modern UI out of the box

## Blockquote

> "Good documentation is the best investment in your project's success. It reduces support burden, improves user adoption, and makes maintenance easier."

## Next Steps

Learn how to [get started](./getting-started) with docvia in your project.
</div>
```
