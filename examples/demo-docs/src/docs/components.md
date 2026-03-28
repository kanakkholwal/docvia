---
title: Components
---

## Components Overview

Interactive components bring your documentation to life. Components are hydrated on-demand using directives in your markdown content.

### Counter Component

A simple counter component demonstrating partial hydration. It persists state and updates reactively.

**Props:**

| Prop    | Type   | Description           |
| ------- | ------ | --------------------- |
| initial | number | Initial counter value |

**Usage:**

```markdown
::counter{initial=0 hydrate="client:load"}
::counter{initial=100 hydrate="client:visible"}
```

**Hydration Strategies:**

- `client:load` - Hydrate immediately when page loads
- `client:visible` - Hydrate only when component becomes visible in viewport
- `client:idle` - Hydrate when browser is idle

### Building Custom Components

Define custom components in your registry and reference them in markdown:

```javascript
const registry = {
  resolve: (name) => {
    if (name === "my-component") return { component: MyComponent };
    return null;
  }
};
```

### Best Practices

- Keep components small and focused
- Use visibility hydration for below-the-fold content
- Test interactive behavior thoroughly
- Consider bundle size impact
