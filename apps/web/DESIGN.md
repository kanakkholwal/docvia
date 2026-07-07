# docvia — Design tokens (source of truth)

> This file supersedes the earlier Clay.com-inspired spec. The cream canvas and
> the 6-color saturated card palette have been retired — they read as
> "AI-generated / web-poster." The system is now **monochrome + one accent**.
>
> For the full design system (typography, spacing, motion, components, page
> archetypes) see the root [`DESIGN.md`](../../DESIGN.md). This file documents the
> exact color / radius tokens as implemented in `apps/web/src/app.css` and
> `apps/docs/src/app.css` (the two files are kept byte-identical in their token
> blocks).

## Overview

The base atmosphere is a **cool-neutral canvas** (`--canvas` — `#ffffff` light /
`#0a0a0a` dark) holding ink type, with a single **electric lime** (`--brand` —
`#c6f24e`) as the only brand voltage. The lime is used **scarcely** at the element
level (status dots, active states, one accent detail per card, the featured tier)
and **generously** in exactly one place: the full-bleed lime pre-footer CTA band.
That scarcity-then-abundance is what gives the lime its punch.

Primary CTAs are **ink** (near-black fill, white text), never the lime — so the
accent never has to carry a button on a light surface. Feature and use-case cards
are uniform neutral `--surface-card` panels with a hairline border; the old
per-card color cycle is gone.

### Key characteristics

- Cool-neutral (zinc) surfaces — no warm/cream tint. Light is canonical; dark is a
  near-pure-black inversion.
- One accent: electric lime `#c6f24e`. Pair fills with `--on-brand` (`#0a0a0a`)
  text; for lime-colored *text/icons* use `--brand-ink` (dark lime on light,
  bright lime on dark) so it stays legible.
- Ink primary CTAs (`--accent` aliases to `--ink`). The lime is not a button color.
- Uniform neutral cards (`--surface-card` + `--hairline`), one lime detail each.
- The featured pricing tier is a near-black `--surface-dark` card with lime accents
  — premium, not toy.
- Exactly one large lime moment per page: the closing `cta` band.
- Tightened radii (buttons 8px, cards 12px, panels 16px). Pills/dots stay full.
- Generous section rhythm retained: `--space-section` (96px) between bands.

## Color tokens

See the token tables in the root [`DESIGN.md` § 2](../../DESIGN.md). Summary:

| Group | Tokens |
|---|---|
| Surface | `--canvas` · `--surface-soft` · `--surface-card` · `--surface-strong` · `--surface-dark` · `--surface-dark-elevated` |
| Text | `--ink` · `--body-strong` · `--body` · `--muted` · `--muted-soft` · `--on-primary` |
| Border | `--hairline` · `--hairline-strong` |
| Brand | `--brand` · `--brand-strong` · `--brand-ink` · `--brand-soft` · `--on-brand` · `--check` |
| Dark-panel text (absolute) | `--card-on-dark` (`#ffffff`) · `--card-on-light` (`#09090b`) |
| Semantic | `--success` · `--warning` · `--error` |

Every token is exposed to Tailwind as `bg-*` / `text-* / border-*` via
`@theme inline` (e.g. `bg-brand`, `text-brand-ink`, `bg-surface-card`, `text-check`).

### Usage rules

- **Do** reserve `--brand` for dots, active states, one detail per card, the
  featured tier accents, and the single CTA band.
- **Do** use `--brand-ink` for any lime-colored text or icon (never raw `--brand`
  as text on a light surface — it fails contrast).
- **Do** keep primary CTAs on `--ink`.
- **Don't** reintroduce a second brand hue or a per-card color cycle.
- **Don't** put a large lime fill anywhere except the closing CTA band.
- **Don't** use a warm/cream surface — surfaces are cool neutral.

## Radius tokens

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Badge accents, syntax chips |
| `--radius-sm` | 6px | Inline pills, tags |
| `--radius-md` | 8px | Buttons, inputs, render-target chips |
| `--radius-lg` | 12px | Feature / use-case / edition cards, code blocks |
| `--radius-xl` | 16px | Hero panel, CTA band, modals |
| `--radius-pill` | 9999px | Nav pill, badges, status dots, avatars |

## Spacing & typography

Unchanged. Spacing scale (`--space-xxs` 4px … `--space-section` 96px) and the Geist
sans / Geist Mono type stack carry over. Display headlines are `.font-display`
(Geist 600, `-0.025em` tracking). See root [`DESIGN.md`](../../DESIGN.md) for the
full type scale, motion, and component specs.
