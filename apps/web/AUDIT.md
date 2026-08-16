# apps/web audit: contrast, icons, copy, cognitive load

Measured, not asserted. Contrast figures come from resolving every token to its
effective value (alpha composited over its real backdrop) and running the pairs
the UI actually renders. Colour-blind separation via OKLab dE under simulated
protan/deutan/tritan.

Gates: 4.5:1 body text · 3:1 focus ring, control boundary, meaningful icon ·
3:1 luminance **or** >0.10 dE under CVD for two controls told apart by colour.
Decorative hairlines are exempt and are not reported.

---

## 1. Contrast

### Real failures

| # | Issue | Measured | Floor | Where |
| --- | --- | --- | --- | --- |
| C1 | Outline button has no legible boundary | **1.49:1** dark, **1.28:1** light | 3:1 | "View on GitHub", "Star on GitHub" ×2, "Read the contributing guide" |
| C2 | Link hover colour on dark | **4.28:1** (`#8E57FF` on `#16171D`) | 4.5:1 | "Read the architecture overview" |
| C3 | Muted text on `surface-card` in light | **4.47:1** | 4.5:1 | terminal chrome label |

**C1 is the one that matters.** `--hairline: #3B3440` is correct as a *divider*
(it is Vite's measured value and it is doing decorative work everywhere else).
The bug is that the `outline` button variant reuses it as the **only** thing
delimiting a control. One token is serving two jobs. That is a token-model
problem, not a hue problem, which is why it shows up on exactly the four
elements above and nowhere else.

Fix the model, and the ratio enforces itself:

```css
/* dark  */ --control-border: #6e6a78;  /* 3.40:1 on canvas, 3.53:1 on surface */
/* light */ --control-border: #8a8c96;  /* 3.35:1 on canvas, 3.13:1 on surface */
```

Use `--control-border` on interactive outlines only. Leave `--hairline` alone
for section rules, grid dividers, and panel edges.

### Cleared (measured, passing)

Body 9.13:1 · body-strong 13.31:1 · muted 6.24:1 · brand text 7.65:1 · brand on
brand-soft chip 6.80:1 · label on CTA fill 17.88:1 · **focus ring 7.65:1** ·
light-mode brand 7.10:1 and CTA 17.88:1. Nothing else in either theme fails.

### Latent, not currently a violation

- **Semantic colours are light-mode landmines.** `success` 2.28:1, `warning`
  2.15:1, `error` 3.76:1 on white. Today `--success` renders as one 6px dot with
  the adjacent word "typed", so colour is not the sole conveyor and no rule is
  broken. The moment any of the three is used as text on a light surface it
  fails. They were inherited from the lime system and never re-tuned for violet.
- **`#B39AFF` vs `#22C55E` under tritanopia is 0.105 dE**, sitting exactly on
  the floor, with only 1.03:1 luminance separation. Harmless while they never
  appear as paired state colours. Do not introduce a violet/green status pair.
- **Gamut check confirms the light-mode derivation was necessary.** Hue 285 tops
  out at 1.92:1 against white at usable chroma; it cannot serve as a light accent
  at all. Dropping to `#6D28D9` (7.10:1) was the only option, not a preference.

---

## 2. Icons

**Clean:** all 9 icon-only controls carry `aria-label`. Decorative overlays carry
`aria-hidden`. The logo marquee is `aria-hidden` with an `sr-only` text
equivalent. No accessibility findings here.

**The problem is quantity and what the accent is being spent on.**

| # | Issue | Count | Note |
| --- | --- | --- | --- |
| I1 | Violet is doing bullet duty | `text-check` ×7 | plus violet numerals, violet `$`, violet stat values, violet hook badges, violet nav dot |
| I2 | Decorative icon chips | 7 | 4 in use-cases, 3 in open-source: `h-10 w-10` bordered box + violet glyph |
| I3 | Generic AI-marketing glyphs | 2 | `Sparkles` in the announcement bar, `Zap` on the AI badge |

**I1 is the significant one.** The one rule the Vite system states most
emphatically is "use violet sparingly but decisively for active states,
highlights, and brand moments." Right now violet renders as: 7 checkmarks, 6
feature numerals, 5 hook badges, 4 stat values, the `$` prompt, the nav pulse,
the terminal dot, and the CTA halo. That is roughly 25 violet marks per
page. When the accent marks everything, it marks nothing. Checkmarks in
particular have no state to signal; they are list bullets. Demote them to
`--muted` and the remaining violet regains its voltage.

**I2:** vite.dev has zero decorative icons on its homepage. The bordered icon
chips are the most off-target element left on the page and the pattern Vite
specifically avoids.

---

## 3. Copy

The vocabulary is good. No superlatives, no "seamless / robust / leverage /
unlock", every claim is concrete and checkable. The tell is **rhythm**, not word
choice.

**9 of roughly 12 headings use the identical fragment-fragment staccato:**

> Your schema. Your types. Auto-generated.
> Static output. Any host. Your VPC.
> Fast local search. Your AI keys.
> Markdown in. Your framework out.
> Rebuild changed pages. Skip everything else.
> Five hooks. Yours to extend.
> A compiler, not a renderer.
> Free, and free to leave.
> Nothing to meter, nothing to trust us with.

Any one of these is a good line. Nine in a row is a fingerprint. Compare
vite.dev's own headings, which contain zero of this construction: "The Build
Tool for the Web", "Redefining developer experience", "A shared foundation to
build upon", "Loved by the community", "Free & open source". Plain noun phrases.

Two supporting tics:

- **Negation triples**: "no account, no metering, and no telemetry" · "No
  proprietary runtime, no required cloud" · "Fork it, vendor it, ship it
  commercially" · "hash, transform, cache, emit".
- **Possessive reassurance**, 7 times in heading position: "entirely yours to
  own", "Yours to extend", "a build pipeline you own", "free to leave", "Your
  schema. Your types.", "Your AI keys.", "Your VPC."

**Fix:** convert 5 of the 9 to plain noun phrases and keep 3 or 4 staccato lines
for punch. The rhythm only reads as a tic when it is the default.

---

## 4. Cognitive load and UX

| # | Issue | Measured | Severity |
| --- | --- | --- | --- |
| U1 | Same destination, five different labels | 5 links resolve to `docs.docvia.dev` root or `/getting-started`, labelled "Get started" ×2, "Read the docs", "Read the full guide", "Getting started" | High |
| U2 | Repo root linked 7 times under 4 labels | "View on GitHub", "Star on GitHub" ×2, "Star it on GitHub", 2 icon-only | High |
| U3 | Two infinite animation loops | hero terminal (~6s cycle) + logo marquee (32s), both forever | High |
| U4 | Page length | 8,657px = **9.6 viewports** at 900px; vite.dev is ~6 | Medium |
| U5 | FAQ is 10 collapsed rows | Miller's limit for scan-and-choose is 7±2 | Medium |
| U6 | Nav under-represents the page | 3 anchors for 5 anchorable sections; use-cases and FAQ unreachable from nav | Medium |
| U7 | Announcement bar not dismissible | 36px + 80px header = 116px permanent chrome, **13% of a 900px viewport** | Low |

**U1 and U2 together are the real friction.** Twelve links, two destinations. A
reader deciding between "Get started", "Read the docs", and "Read the full
guide" is doing work that produces no outcome, because all three land in the
same place. Collapse to two labels: one for docs, one for the repo.

**U3 is the ADHD-hostile one.** Both loops correctly respect
`prefers-reduced-motion`, and the marquee pauses on hover. But the hero terminal
never stops, never pauses on hover, and has no `IntersectionObserver` gate, so
it keeps cycling while scrolled off-screen. Persistent in-viewport motion is a
continuous attention draw for exactly the users least able to ignore it. It also
burns battery for no benefit once the reader has seen one cycle.

Recommended: run 2 or 3 cycles then rest on the completed state, pause on hover,
and gate on `IntersectionObserver` so it never animates off-screen.

**Good already:** skip link present, focus ring visible at 7.65:1, all
icon-controls labelled, reduced-motion honoured globally, no layout shift from
the terminal (fixed `min-h`), FAQ first item open by default, install command has
a real copy affordance with state feedback.

---

## 5. Priority

Score = (share of users affected × severity) / effort.

| Rank | Fix | Effort | Why first |
| --- | --- | --- | --- |
| 1 | `--control-border` token for outline buttons (C1) | S | Only measured WCAG failure with real reach; 4 controls |
| 2 | Collapse duplicate CTAs (U1, U2) | S | Removes a pointless decision from every reader |
| 3 | Demote violet checkmarks and numerals to muted (I1) | S | Restores the accent; one-line changes |
| 4 | Bound the terminal loop, pause on hover, gate on viewport (U3) | M | Biggest attention cost on the page |
| 5 | Rewrite 5 staccato headings as noun phrases (copy) | M | The thing that makes it read as generated |
| 6 | Drop the 7 decorative icon chips (I2) | S | Last visibly off-target element vs vite.dev |
| 7 | Re-tune semantic colours for violet + light mode | S | Latent, but currently unusable as text |
| 8 | Trim FAQ to 7, move the rest to docs (U5) | M | Shortens the page and respects the scan limit |
