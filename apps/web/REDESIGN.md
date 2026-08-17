# docvia.dev vs vite.dev, measured breakdown

Values below are **computed styles pulled off the live vite.dev over Chrome
DevTools Protocol**, not read off a screenshot or a design doc. Where
`apps/web/DESIGN.md` disagreed with the live site, the live site won.

Reproduce: launch Chrome with `--headless=new --remote-debugging-port=9222`,
then drive `Runtime.evaluate` over the CDP websocket to dump `getComputedStyle`
across the page. Scratch scripts are session-local.

---

## 1. Where DESIGN.md was wrong

The extracted doc was close on the canvas and the accent, and wrong on
everything structural. These were the four that mattered.

| Token | DESIGN.md said | vite.dev actually is |
| --- | --- | --- |
| Surface layering | `#1B1C23` / `#20212A`, **lighter** than canvas | `#14121A`, **darker**. Panels are recessed, not raised. |
| Border | `#343545` | **`#3B3440`** (warmer, purpler), 51 elements use it |
| `button-primary` | `{colors.surface}` | **`#FFFFFF`** with `#16171D` text |
| Muted text | `#C7CAD1` | Hero subhead is **`rgba(255,255,255,0.7)`**, not a solid grey; meta text is `#98989F` / `#867E8E` |

## 2. Measured palette (now implemented verbatim)

| Role | Value | Evidence |
| --- | --- | --- |
| Canvas | `#16171D` | `html` + `body` background |
| Surface (recessed) | `#14121A` | search box, code panels |
| Border | `#3B3440` | 51 elements; every `border-t` section rule |
| Border alt | `#2E2E32` | 9 elements |
| Text | `#FFFFFF` | 117 elements |
| Subhead | `rgba(255,255,255,0.7)` | hero paragraph |
| Muted | `#98989F` | search placeholder, meta |
| Muted alt | `#867E8E` | mono `BY` label |
| Accent | `#B39AFF` | `$` prompt, links, active states |
| Deep violet | `#370A7F` | flat fill behind feature media panels |
| CTA fill | `#FFFFFF` on `#16171D` | "Get Started" |

## 3. Measured typography

| Element | vite.dev | docvia now |
| --- | --- | --- |
| h1 | APK Protocol 500 · 60px / 67.2px / **−3px** | Satoshi 500 · 60 / 67.2 / −3px ✅ |
| Section h2 | 48px / 48px / −1.2px, **centred** | 48 / 48 / −1.2px, centred ✅ |
| 40px step | 40px / 53.33px / −1px | ✅ |
| Card title | 24px / 28px / **letter-spacing normal** | 24 / 28 / normal ✅ |
| Trust heading | 20px / 28px / normal | 20 / 28 / normal ✅ |
| Hero subhead | Inter 400 · 18px / 28px | Inter 400 · 18 / 28 ✅ |
| Body | Inter 400 · 16px / 22.4px | ✅ |
| Meta label | **KH Teka Mono 500 · 12px · uppercase · 0.3px** | Geist Mono 500 · 12 · uppercase · 0.025em ✅ |
| Button label | Inter 500 · 16px | ✅ |

**Tracking rule worth stealing:** negative tracking only above 40px. At 24px and
below it goes to **zero**. That is why their card titles read open instead of
squeezed. My first pass had −0.03em on 24px titles, which was wrong.

**Font substitutions.** APK Protocol and KH Teka Mono are Vite's proprietary
faces and are not licensable. **Satoshi** (Fontshare, variable 300-900,
self-hosted at `static/fonts/satoshi-variable.woff2`, 42 KB, preloaded) stands in
for APK Protocol, same geometric grotesk character, holds −0.05em without
collapsing. Inter is the real thing (`@fontsource-variable/inter`). Geist Mono
covers KH Teka Mono.

## 4. Measured layout

| Aspect | vite.dev | docvia now |
| --- | --- | --- |
| Container | **1390px** | `--container-page: 1390px` ✅ |
| Gutters | `px-5 sm:px-10` (20 / 40) | ✅ |
| Section padding | `py-14 sm:py-28` (56 / **112**) | ✅ |
| Header | solid `#16171D`, 1px rule, **no backdrop blur** | solid, no blur ✅ (kept sticky, their homepage header is static, but this page is 8.6k px) |
| Button | 38px · 8px radius · 8/16 padding | ✅ |
| **Cards** | **zero. `cards: []`.** Full-bleed cells, 1px dividers, `divide-x` | full-bleed `gap-px` grids ✅ |
| Grid sections | heading and grid are **separate sections**; grid is `py-0` edge-to-edge | ✅ |
| Shadow | none, except a violet halo on the hero CTA | ✅ |

**The card finding is the big one.** My first pass converted your original
`gap-px` hairline grid into discrete bordered cards. That was a regression:
vite.dev has no cards anywhere on the homepage. Reverted, and the heading/grid
split means the grids now run edge-to-edge with no dead padding around them.

**The hero is not centred.** It is a left-aligned 6/6 split with a vertical
divider: copy left, illustration right, install block pinned to the bottom of the
left column. My first pass centred it based on a text scrape of the page. Your
original split hero was structurally right; it is back.

## 5. Verification

`svelte-check`: 0 errors (1 pre-existing accordion warning). Post-change CDP
re-measure against vite.dev:

```text
 MATCH canvas         rgb(22, 23, 29)
 MATCH body lh        22.4px
 MATCH h1 size        60px      weight 500   lh 67.2px   ls -3px
 MATCH heroP          18px / 28px / rgba(255,255,255,0.7)
 MATCH button         #FFF on #16171D, 8px, 16px pad, 38px, 16px/500
 MATCH border         rgb(59, 52, 64)
 MATCH surfaces       rgb(22,23,29) + rgb(20,18,26)
```

## 6. Deliberately not copied

- **"Trusted by OpenAI / Shopify / Stripe"** and the testimonial grid. Copying
  the shape of social proof without the substance is what makes a site read as a
  knock-off. The tech marquee and the honest `0kb / 5+ / 100% / MIT` stats stay.
- **The `#370A7F` media panels.** They exist to hold Vite's 3D renders. Nothing
  to put in them yet; the token is defined for when there is.
- **Light theme.** vite.dev's homepage is dark-only. Light is kept and derived
  (`#7C3AED` fills, which pass contrast where `#B39AFF` does not).
