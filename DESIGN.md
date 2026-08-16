# docvia — Design System

> **Superseded for `apps/web`.** The marketing site now implements the Vite Dark
> system in [`apps/web/DESIGN.md`](apps/web/DESIGN.md): violet accent on a
> `#16171D` canvas, dark by default, 8px radius, borders instead of shadows.
> [`apps/web/REDESIGN.md`](apps/web/REDESIGN.md) records the diff.
> **`apps/docs` still runs the lime system documented below** and needs the same
> token migration before the two apps read as one product.

The single source of truth for visual design across `apps/web` (marketing) and
`apps/docs` (documentation). Both apps consume the same Tailwind tokens and
shadcn-svelte component primitives so the brand reads as one product.

The aim is a quiet, technical aesthetic — closer to Linear / Vercel / Mintlify
than to a SaaS landing page. Generous whitespace, restrained motion, one
accent color, monospace where it pays off, no gradients in body content.

---

## 1. Brand voice

| Attribute | Yes | No |
|---|---|---|
| Tone | Direct, plain English | Marketing superlatives |
| Density | Generous whitespace, large hit targets | Cramped grids |
| Color | One accent (electric lime), neutral surface | Multi-color palettes, rainbow cards |
| Motion | 150–200 ms ease-out, optional | 500 ms+ entrances, parallax |
| Type | Mixed sans + mono, tight tracking on display | All-caps, decorative fonts |
| Imagery | Diagrams, code, real screenshots | Stock photos, 3D illustrations |

---

## 2. Color tokens

All colors are defined as CSS custom properties on `:root` / `[data-theme="light"]`
and `[data-theme="dark"]` in `apps/*/src/app.css`, and exposed to Tailwind v4 via
`@theme inline { --color-*: var(--*) }`. Light is the canonical theme; dark is a
near-black inversion.

The system is **monochrome + one accent**. There is exactly one brand color — an
electric **lime** — used scarcely (dots, active states, the featured tier, a single
full-bleed CTA band). Primary actions are **ink** (near-black), never the accent, so
the lime never has to work as a button fill on a light surface. Surfaces are a **cool
neutral** (zinc) scale — no warm/cream tint.

### Surface (canonical tokens)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#ffffff` | `#0a0a0a` | Page background |
| `--surface-soft` | `#fafafa` | `#131316` | Soft bands, footer, hero panel |
| `--surface-card` | `#f4f4f5` | `#18181b` | Cards, code-block bg, hover surfaces |
| `--surface-strong` | `#e4e4e7` | `#27272a` | Emphasized fills, inactive chips |
| `--surface-dark` | `#0a0a0a` | `#000000` | Embedded dark panels (code windows, featured tier) |
| `--surface-dark-elevated` | `#18181b` | `#18181b` | Nested panels inside a dark surface |

### Text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | `#09090b` | `#fafafa` | Headlines, primary text |
| `--body-strong` | `#18181b` | `#e4e4e7` | Emphasized body, lead paragraphs |
| `--body` | `#3f3f46` | `#a1a1aa` | Default running-text |
| `--muted` | `#71717a` | `#71717a` | Captions, eyebrow labels, breadcrumbs |
| `--muted-soft` | `#a1a1aa` | `#52525b` | Fine-print, placeholders |
| `--on-primary` | `#ffffff` | `#0a0a0a` | Text on an ink CTA |

### Borders

| Token | Light | Dark | Use |
|---|---|---|---|
| `--hairline` | `#e4e4e7` | `#27272a` | 1px dividers, card borders |
| `--hairline-strong` | `#d4d4d8` | `#3f3f46` | Inputs, prominent borders, neutral dots |

### Brand — the single accent (electric lime)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#c6f24e` | `#c6f24e` | Fill voltage: dots, active pills, featured accents, the CTA band |
| `--brand-strong` | `#aee02f` | `#aee02f` | Pressed / hover-darker fill |
| `--brand-ink` | `#4d6b00` | `#c6f24e` | Brand-colored **text / icons**, legible on the current theme |
| `--brand-soft` | `#eef6d0` | `#232b0c` | Subtle brand-tinted background (icon chips, table column) |
| `--on-brand` | `#0a0a0a` | `#0a0a0a` | Text / icons sitting on a `--brand` fill |
| `--check` | = `--brand-ink` | = `--brand` | Positive-state check marks — stays legible on both themes |

`--card-on-dark` (`#ffffff`) and `--card-on-light` (`#09090b`) are **absolute** (they
do not flip with theme) — used for text on the dark featured tier and embedded code panels.

### Semantic

| Token | Value | Use |
|---|---|---|
| `--success` | `#22c55e` | Success / "typed" status dots |
| `--warning` | `#f59e0b` | Warning callouts |
| `--error` | `#ef4444` | Validation errors |

### Legacy aliases

For back-compat, the older shadcn-style names remain as aliases: `--bg`→`--canvas`,
`--fg`→`--ink`, `--bg-muted`→`--surface-card`, `--border`→`--hairline`, and
**`--accent`→`--ink`** (so `Button variant="primary"` stays ink-filled). Prefer the
canonical tokens above in new code.

---

## 3. Typography

### Families

| Token | Stack |
|---|---|
| `--font-sans` | `"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif` |
| `--font-display` | `"Geist", "Inter Variable", ui-sans-serif, system-ui, sans-serif` |
| `--font-mono` | `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` |

### Scale (Tailwind class → token → use)

| Class | Size / line-height | Use |
|---|---|---|
| `text-xs` | 12 / 16 | Eyebrow labels, table captions |
| `text-sm` | 14 / 20 | Secondary copy, sidebar |
| `text-base` | 16 / 24 | Body |
| `text-lg` | 18 / 28 | Lead paragraphs |
| `text-xl` | 20 / 30 | Subsection titles |
| `text-2xl` | 24 / 32 | H3 |
| `text-3xl` | 30 / 36 | H2 |
| `text-4xl` | 36 / 40 | H1 (docs) |
| `text-display-1` | 64 / 1.05, tracking `-0.03em`, weight 600 | Hero headline |
| `text-display-2` | 48 / 1.1, tracking `-0.025em`, weight 600 | Section titles |
| `text-display-3` | 36 / 1.15, tracking `-0.02em`, weight 600 | Page titles |

### Weight policy

- 400 body, 500 UI, 600 display, 700 reserved for accents only.
- Never bold body copy at small sizes — use color contrast instead.

### Tracking

- Display sizes: `-0.03em` to `-0.02em` (tight).
- Body: `0`.
- Eyebrow / labels: `0.05em` uppercase, `text-xs`.

---

## 4. Spacing & layout

Tailwind's default 4 px scale, with these guard rails:

| Context | Spacing |
|---|---|
| Section vertical padding | `py-24 md:py-32` |
| Section horizontal padding | `px-6 md:px-10` |
| Container width | max `1200px` for marketing, `1280px` for docs |
| Doc content width | `max-w-3xl` (~720 px) for prose; `max-w-5xl` for tables |
| Sidebar width | `w-64` (256 px) |
| Card padding | `p-6` |
| Inline pill padding | `px-2 py-0.5` |
| Section heading margin | `mt-16 mb-6` |

### Grid

12-col CSS grid via Tailwind's `grid-cols-12`, with `gap-6` between content
blocks and `gap-12` between sections. Three-up feature grids use
`grid-cols-1 md:grid-cols-3`.

---

## 5. Radius, borders, shadows

Tightened one step from the old scale (buttons 12→8, cards 24→16) — the previous
radii read as too soft. Pills/dots keep a full radius; everything else is crisper.

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4 px | Badge accents, syntax chips |
| `--radius-sm` | 6 px | Inline pills, tags, focus ring |
| `--radius-md` | 8 px | Inputs, buttons, render-target chips |
| `--radius-lg` | 12 px | Cards, code blocks, feature/use-case/edition cards |
| `--radius-xl` | 16 px | Hero panel, CTA band, modals |
| `--radius-pill` | 9999 px | Nav pill, badge pills, status dots, avatars |

Borders: 1 px hairlines (`--border`); only escalate to `--border-strong` for
inputs and focused surfaces.

Shadows are flat — minimum elevation. Use only for floating/popover content.

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px 0 oklch(0 0 0 / 0.05)` |
| `--shadow-md` | `0 4px 12px -2px oklch(0 0 0 / 0.08)` |
| `--shadow-lg` | `0 16px 32px -8px oklch(0 0 0 / 0.12)` |

No glows, no gradients in shadows.

---

## 6. Motion

Reduced-motion is honored everywhere via `@media (prefers-reduced-motion: reduce)`.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-fast` | 100 ms | `ease-out` | Hover, focus rings |
| `--motion-base` | 180 ms | `cubic-bezier(0.2, 0, 0, 1)` | Toggles, popovers |
| `--motion-slow` | 280 ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Sheet/dialog enter |

Animations should:
- Move ≤ 8 px on entry.
- Avoid bouncing easings.
- Never block interaction (no entrance > 300 ms).

---

## 7. Code blocks

Code is the product — it deserves first-class treatment.

- **Theme:** Shiki `github-dark` for both light and dark UI (consistent code
  voice). Light mode wraps it in a subtle `--bg-muted` panel; dark mode in
  `oklch(0.18 0 0)`.
- **Padding:** `p-4 md:p-5`.
- **Font:** `--font-mono`, `text-sm`, line-height `1.6`.
- **Filename header:** thin top bar with filename in `text-xs --fg-muted`,
  `--border` divider underneath.
- **Copy button:** absolutely positioned top-right, `--motion-fast` opacity.
- **Inline code:** `--bg-muted` background, `--radius-sm`, `px-1.5 py-0.5`,
  `text-[0.9em]`, `--font-mono`.

Never use rainbow theme variants in body copy.

---

## 8. Component primitives (shadcn-svelte)

Both apps register the following from `shadcn-svelte`:

`button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`,
`scroll-area`, `select`, `separator`, `sheet`, `switch`, `tabs`, `toast`,
`tooltip`, `command` (for cmd-K search in docs).

Variants we extend on `Button`:

| Variant | Use |
|---|---|
| `primary` (default `default`) | Main CTA — accent fill |
| `secondary` | Secondary actions — muted fill |
| `ghost` | Nav links, tertiary |
| `outline` | Cards CTA |
| `link` | Inline nav |

Sizes: `sm`, `default`, `lg`. Default to `default` on desktop, `lg` for hero
CTAs.

---

## 9. Iconography

- `lucide-svelte` for everything UI-chrome.
- Stroke 1.5, size `h-4 w-4` inline / `h-5 w-5` standalone.
- Never mix two icon libraries in one view.
- Brand mark: monogram `d` in `--accent`, square 32×32 with `--radius-md`.

---

## 10. Page archetypes

### `apps/web` — Landing

1. **Hero**: display-1 headline (≤ 8 words), one paragraph of supporting
   prose, two CTAs (`primary` + `ghost`), terminal mock (Shiki-rendered).
2. **Logo strip**: 5–6 wordmarks at 24 px, opacity 0.6.
3. **Feature grid**: three columns, icon + title + 1-line description.
4. **Code-first feature**: side-by-side code panel (left) + plain-language
   explanation (right). Two of these, alternating sides.
5. **Quick-start**: three-step recipe with copy-able shell commands.
6. **Closing CTA**: single accent-bg panel, one CTA.
7. **Footer**: thin, three columns (product / resources / company).

### `apps/docs` — Documentation

1. **Top bar**: brand mark, search (cmd-K), version pill, GitHub link, theme toggle.
2. **Sidebar (left, `w-64`)**: collapsible section groups, one accent dot
   marks the active page.
3. **Content (`max-w-3xl`)**: page title (display-3), description in
   `--fg-muted`, prose, callouts, code blocks.
4. **TOC (right, `w-56`, sticky)**: H2/H3 anchors with active-section
   indicator.
5. **Footer**: prev/next, "Edit on GitHub", last-updated stamp.

---

## 11. Implementation rules

- Tailwind v4 with `@theme inline { ... }` mapping CSS custom properties.
- Dark mode toggled via `data-theme="dark"` on `<html>`; persisted in
  `localStorage` key `docvia-theme`.
- shadcn-svelte components live in `src/lib/components/ui/` and are vendored
  (not imported from a package) so each app can extend them.
- Shared design tokens live in `apps/web/src/lib/styles/tokens.css` and
  `apps/docs/src/lib/styles/tokens.css` — kept identical. (For v0.2 we will
  extract a `@docvia/ui` workspace package; for the v0.1 starter the
  duplication is acceptable.)
- No CSS-in-JS. No utility-first leakage into `.svelte` files beyond what
  Tailwind handles — extract to `<style>` blocks when an element needs more
  than ~6 utilities.
- Every component must work without JavaScript for the first paint
  (progressive enhancement).

---

## 12. Accessibility floor

- Color contrast ≥ 4.5:1 for body text against its surface; ≥ 3:1 for large
  display text.
- Focus rings always visible — `outline outline-2 outline-offset-2 outline-[--accent]`.
- Every interactive element keyboard-reachable; `tabindex="-1"` only on
  programmatically focused containers.
- All images and icons that convey meaning have an `alt` or `aria-label`.
- Skip-to-content link in both apps.
