# docvia — Design System

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
| Color | One accent (electric violet), neutral surface | Multi-color gradients, rainbow code |
| Motion | 150–200 ms ease-out, optional | 500 ms+ entrances, parallax |
| Type | Mixed sans + mono, tight tracking on display | All-caps, decorative fonts |
| Imagery | Diagrams, code, real screenshots | Stock photos, 3D illustrations |

---

## 2. Color tokens

All colors are defined as CSS custom properties on `:root` and `[data-theme="dark"]`.
Tailwind reads them via `theme.extend.colors`.

### Semantic palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `oklch(0.99 0 0)` | `oklch(0.145 0 0)` | Page background |
| `--bg-subtle` | `oklch(0.975 0 0)` | `oklch(0.18 0 0)` | Cards, sidebar bg |
| `--bg-muted` | `oklch(0.95 0.005 250)` | `oklch(0.21 0.005 250)` | Code block bg, hover surfaces |
| `--fg` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `--fg-muted` | `oklch(0.45 0.005 250)` | `oklch(0.7 0.005 250)` | Secondary text, captions |
| `--fg-subtle` | `oklch(0.6 0.005 250)` | `oklch(0.55 0.005 250)` | Tertiary text, placeholders |
| `--border` | `oklch(0.92 0.005 250)` | `oklch(0.27 0.005 250)` | Hairline dividers |
| `--border-strong` | `oklch(0.85 0.005 250)` | `oklch(0.34 0.005 250)` | Inputs, prominent borders |
| `--accent` | `oklch(0.58 0.22 290)` | `oklch(0.7 0.21 290)` | Primary brand — violet |
| `--accent-fg` | `oklch(0.99 0 0)` | `oklch(0.145 0 0)` | Foreground on accent |
| `--accent-subtle` | `oklch(0.96 0.04 290)` | `oklch(0.25 0.08 290)` | Accent backgrounds |
| `--success` | `oklch(0.6 0.15 155)` | `oklch(0.7 0.15 155)` | Success state |
| `--warn` | `oklch(0.7 0.18 75)` | `oklch(0.78 0.18 75)` | Warning state |
| `--danger` | `oklch(0.58 0.22 25)` | `oklch(0.7 0.2 25)` | Error state |
| `--info` | `oklch(0.6 0.18 230)` | `oklch(0.72 0.18 230)` | Info state |

### shadcn-svelte mappings

shadcn-svelte expects HSL-style tokens. We expose both:

| shadcn token | Maps to |
|---|---|
| `--background` | `--bg` |
| `--foreground` | `--fg` |
| `--card` | `--bg-subtle` |
| `--card-foreground` | `--fg` |
| `--popover` | `--bg-subtle` |
| `--popover-foreground` | `--fg` |
| `--primary` | `--accent` |
| `--primary-foreground` | `--accent-fg` |
| `--secondary` | `--bg-muted` |
| `--secondary-foreground` | `--fg` |
| `--muted` | `--bg-muted` |
| `--muted-foreground` | `--fg-muted` |
| `--accent` | `--accent-subtle` |
| `--accent-foreground` | `--fg` |
| `--destructive` | `--danger` |
| `--destructive-foreground` | `--accent-fg` |
| `--border` | `--border` |
| `--input` | `--border-strong` |
| `--ring` | `--accent` |

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

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6 px | Inline pills, tags |
| `--radius-md` | 8 px | Inputs, buttons |
| `--radius-lg` | 12 px | Cards, code blocks |
| `--radius-xl` | 16 px | Hero panels, modals |
| `--radius-full` | 9999 px | Avatars, circle icons |

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
