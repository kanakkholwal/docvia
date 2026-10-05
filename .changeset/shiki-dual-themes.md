---
"@docvia/plugin-shiki": minor
---

Dual-theme highlighting.

- New `themes: { light, dark }` option loads both themes and emits Shiki's CSS variables (`--shiki-light`, `--shiki-dark`, `--shiki-light-bg`, `--shiki-dark-bg`), so code blocks can follow the site's light or dark mode without re-highlighting.
- New `defaultColor` option (`"light"`, `"dark"` or `false`) is passed through to Shiki.
- `theme` still works for a single theme. The cache key includes the theme names, so changing them recompiles pages.
