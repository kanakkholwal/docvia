---
title: Components
description: Using custom components via directives
tags: [advanced, components]
order: 2
---

# Components

Dockit supports custom components via the directive syntax.

## Usage

Use the `::directive` syntax to embed components:

:::note
This is a note component rendered via the directive system.
:::

:::warning
This is a warning — handle with care!
:::

:::counter{initial=10}
This is a counter component rendered via the directive system.
:::

## Code Examples

Here's a TypeScript example:

```typescript
import { defineConfig } from '@dockit/cli';

export default defineConfig({
  dir: 'docs',
  plugins: [],
});
```

And a Svelte component:

```svelte
<script>
  export let title = 'Hello';
</script>

<div class="card">
  <h2>{title}</h2>
  <slot />
</div>
```
