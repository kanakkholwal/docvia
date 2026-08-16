# docvia.dev vs vite.dev — gap breakdown

Ruthless read of what vite.dev does that `apps/web` did not. Target system is
`apps/web/DESIGN.md` (Vite Dark). Status column reflects this redesign pass.

---

## 1. The three things that actually made the difference

| # | Gap | Why it read cheap |
|---|---|---|
| 1 | **Split hero** | docvia put the headline in a 6-col box with a terminal jammed beside it. Vite centers one big headline in open space and lets the page breathe before showing anything. A boxed headline reads like a template; a centered one reads like a launch. |
| 2 | **Weight over tracking** | docvia display type was 600 weight at `-0.035em`. Vite is **500 weight at `-0.05em`**. Heavy + loose = marketing brochure. Light + tight = engineered. This one number changes the whole personality. |
| 3 | **Radius drift** | docvia mixed 8 / 12 / 16px radii (`rounded-md`, `-lg`, `-xl`, `-2xl`) with a 80px-blur drop shadow on the hero panel. Vite is 8px, everywhere, with zero shadow. Consistency at one value reads as a system; four values read as accident. |

---

## 2. Token-level diff

| Token | docvia (before) | Vite Dark | Status |
|---|---|---|---|
| Canvas (dark) | `#0a0a0a` pure black | `#16171D` | ✅ changed |
| Accent | `#c6f24e` lime | `#B39AFF` / `#8E57FF` | ✅ changed |
| Surface layers | 2 (`soft`, `card`) | 3 (`surface`, `raised`, `strong`) | ✅ added `--surface-raised` |
| Border | 1 hairline | `border` + `border-strong` | ✅ both wired |
| Radius default | mixed 8/12/16 | **8px everywhere** | ✅ normalized |
| Display weight | 600 | **500** | ✅ changed |
| Display tracking | −0.035em | **−0.05em** | ✅ changed |
| Spacing scale | 4/8/12/16/24/32/48/96 | **12/24/40/80/112** | ✅ replaced |
| Shadow | `0 30px 80px -40px` on hero | none — borders only | ✅ removed |
| Default theme | light | dark | ✅ dark default, toggle kept |

**Deviations from `DESIGN.md`, deliberate:**

- **APK Protocol → Geist 500.** APK Protocol is Vite's proprietary brand face.
  Geist is already installed, is geometric/compact, and takes −0.05em tracking
  without falling apart. Inter is likewise substituted with Geist rather than
  adding a font dependency and a second network round-trip.
- **`button-primary` is violet, not `{colors.surface}`.** The extracted token
  says surface-fill, but vite.dev's actual hero CTA is a solid violet button.
  Surface-fill primary + surface-fill secondary would leave the page with no
  brand moment at all. Primary = violet, secondary = surface.

---

## 3. Structural diff

| Vite section | docvia (before) | Status |
|---|---|---|
| Centered hero + install block | Split 6/6, terminal in right column | ✅ centered; terminal promoted to a full-width showpiece below |
| "Trusted by the world's best software teams" + logo row | Tech-logo marquee | ✅ kept marquee (we can't claim customers we don't have), restyled to Vite's muted-logo treatment |
| Features: 4 cards *with UI imagery inside each* | 6 panels in a `gap-px` hairline grid | ✅ discrete bordered cards on canvas, UI fragments kept |
| Ecosystem: second 4-card group | — | ⏭️ deep-dive section covers this ground |
| Framework logo grid | marquee | ✅ merged |
| Social proof: stars, downloads, testimonials | 4 architectural stats | ✅ stats kept + moved late (proof belongs after the pitch, not before it) |
| **"Free & open source" + MIT + sponsor CTA** | **missing** | ✅ **added** (`open-source.svelte`) |
| Quiet centered closing CTA | Full-bleed lime colour band | ✅ replaced with a centered CTA + violet glow |
| 3-column footer | 3-column footer | ✅ already matched, restyled |

---

## 4. Craft details Vite gets right that docvia missed

Applied via `emil-design-eng` / `ux-designer`:

| Before | After | Why |
|---|---|---|
| `--ease-out: cubic-bezier(0.2,0,0,1)` | `cubic-bezier(0.23,1,0.32,1)` | Built-in-strength curves have no punch; the stronger out-curve makes 180ms *feel* like 120ms |
| No `:active` state on any button | `transform: scale(0.97)` | Press feedback is the cheapest "this app is listening" signal there is |
| `transition-colors` only | `transition: color, background-color, border-color, transform` | Transform was never transitioned, so the new press state would have snapped |
| Hover states unguarded | `@media (hover: hover) and (pointer: fine)` | Touch devices fire hover on tap, leaving buttons stuck lit |
| Focus ring = `--ink` (invisible on dark) | `--focus` = brand violet, 2px + offset | On a `#16171D` canvas an ink outline is literally invisible |
| Reveal stagger 60/140/220/300/360ms | 40/80/120/160/200ms | 360ms before the last hero element lands is a visibly slow page |
| Marquee `32s linear` | unchanged | Correct already — constant motion takes `linear` |
| Accordion `slide` 200ms | + `ease-out`, chevron 180ms | Default slide easing is `cubic-bezier(0.25,0.1,0.25,1)`, too soft for a 200ms move |

---

## 5. What was left alone, and why

- **The build terminal animation.** It's the single most product-specific thing
  on the page. Vite has nothing like it. Promoted, not removed.
- **Honest stats.** `0kb / 5+ / 100% / MIT` instead of Vite's 80k stars. Copying
  the *shape* of social proof without the substance is the one thing that would
  make this look like a knock-off.
- **No testimonials.** Same reason. The slot exists in the layout if real quotes
  ever arrive.
- **Light theme.** Vite ships one; the doc is dark-only. Light is now derived
  from the violet system (`#7C3AED` for legible fills) rather than deleted.
