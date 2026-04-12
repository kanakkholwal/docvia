---
title: Components
description: Embed interactive Svelte components in your Markdown documentation using directives and selective hydration.
order: 4
---

# Components

Docvia supports embedding interactive components directly in Markdown using the directive syntax. Components are registered in your config and hydrated on the client.

## Directive syntax

**Block directive**:

```markdown
:::counter{initial=42}
:::
```

**Inline directive**:

```markdown
Check the :badge{text="new"} feature.
```

## Registration

Register components in `docvia.config.ts`:

```typescript
export default defineConfig({
  components: {
    counter: {
      path: "./src/lib/components/Counter.svelte",
      hydrate: true,
      defaultProps: { initial: 0 },
    },
  },
});
```

## Hydration modes

| Mode | When | Use case |
| --- | --- | --- |
| `hydrate: false` | Never | Static content only |
| `hydrate: true` | Immediate | Interactive on first paint |
| `client:idle` | On idle | After main thread is free |
| `client:visible` | On intersection | When scrolled into view |

## Live example

Here is an interactive counter embedded via directive:

:::counter{initial=42}
:::

The counter is server-rendered then hydrated client-side.

## Creating components

Components are standard Svelte 5 components:

```svelte
<script lang="ts">
  let { initial = 0 } = $props();
  let count = $state(initial);
</script>

<div class="counter-card">
  <div class="counter-value">{count}</div>
  <div class="counter-controls">
    <button class="btn" onclick={() => count--}>-</button>
    <button class="btn" onclick={() => count = initial}>Reset</button>
    <button class="btn btn-primary" onclick={() => count++}>+</button>
  </div>
</div>
```
