---
version: alpha
name: Vite Dark
description: A high-contrast developer-focused dark system with vivid violet accents and restrained editorial typography.
colors:
  primary: "#B39AFF"
  primary-strong: "#8E57FF"
  secondary: "#16171D"
  tertiary: "#374151"
  neutral: "#FFFFFF"
  neutral-muted: "#C7CAD1"
  surface: "#1B1C23"
  surface-raised: "#20212A"
  on-surface: "#FFFFFF"
  border: "#343545"
  border-strong: "#4B4A5D"
  error: "#EF4444"
typography:
  headline-display:
    fontFamily: "APK Protocol"
    fontSize: "60px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.05em"
  headline-lg:
    fontFamily: "APK Protocol"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline-md:
    fontFamily: "APK Protocol"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline-sm:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "0em"
  body-lg:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: "0em"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0em"
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label-lg:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0em"
  label-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
  label-sm:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  code-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 12px
  sm: 24px
  md: 40px
  lg: 80px
  xl: 112px
components:
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "38px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "38px"
  card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    height: "40px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  code-block:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Vite Dark

## Overview
Vite’s visual language is dark, technical, and confident, with a strong developer-tool personality. It feels spacious and editorial rather than dense, using a large hero headline, restrained copy, and prominent violet accents to signal speed and innovation. The overall tone is professional but energetic, balancing utility with a polished launch-brand aesthetic.

## Colors
- **Primary (#B39AFF):** A luminous violet used for active states, highlights, focus moments, and the signature glow of the brand. It gives the interface a future-facing, energetic feel without overpowering the content.
- **Primary-Strong (#8E57FF):** A deeper electric violet for hover states, emphasis strokes, and layered gradients where a more saturated accent is needed.
- **Secondary (#16171D):** The core near-black canvas that defines the site’s dark theme. It supports a calm, low-noise reading environment and makes light text and accents feel crisp.
- **Surface (#1B1C23):** Slightly lifted from the background, this token is useful for panels, buttons, and code surfaces that need separation without breaking the dark mood.
- **Surface-Raised (#20212A):** A subtle raised layer for interactive surfaces, hover feedback, and cards that need a touch more depth.
- **Neutral (#FFFFFF):** Pure white used for the highest-contrast text, primary CTA labels, and key navigation items.
- **Neutral-Muted (#C7CAD1):** Soft gray text for supporting copy, meta labels, and secondary interface content.
- **Border (#343545):** The understated divider color for cards, code containers, nav rules, and structural boundaries.
- **Border-Strong (#4B4A5D):** A slightly clearer divider for selected or more prominent edges.
- **Error (#EF4444):** Reserved for validation and destructive states; it should stay visually separate from the brand violet.

## Typography
Headlines use **APK Protocol**, giving the brand a compact, modern, slightly geometric character. The display hierarchy is strong and editorial: `headline-display` and `headline-lg` are large, tightly tracked, and weighted at 500 to create a crisp, product-launch feel rather than a heavy marketing look.

Body and UI text use **Inter**, which keeps the interface highly legible and familiar for developer audiences. `body-md` is the default reading size, while `label-lg`, `label-md`, and `label-sm` support navigation, buttons, tabs, and metadata with a medium weight for clarity. Letter spacing stays mostly neutral, with only small positive tracking on smaller labels to improve clarity; uppercase treatment should be used sparingly, mainly for compact meta or utility contexts.

## Layout & Spacing
The layout is built around a wide, fixed-max-width hero container with clear vertical sections and strong structural dividers. The page breathes: large left/right padding, generous hero spacing, and a visible rhythm between navigation, hero, social proof, and content blocks. Use the spacing scale as a simple progression from `xs` 12px and `sm` 24px to `md` 40px, `lg` 80px, and `xl` 112px for major section breaks and large compositional gaps.

Cards, terminal/code blocks, and grouped UI elements should use compact internal padding, typically 16px to 24px, while primary sections need much larger outer spacing. Horizontal rules and borders are preferred over dense shadow stacking, which keeps the page feeling crisp and engineered.

## Elevation & Depth
Depth is intentionally minimal and mostly achieved through tonal layering, thin borders, and contrast rather than shadow. The interface uses a nearly flat treatment overall, with `card` and `code-block` surfaces distinguished by subtle boundary lines and slight surface variation instead of dramatic elevation. Where motion or prominence is needed, use the violet accent and stronger contrast rather than heavy shadows.

## Shapes
The shape language is clean and moderately rounded, with 8px corners as the default. Buttons, cards, inputs, and code panels all feel softly engineered rather than pill-shaped or sharply angular. Reserve `rounded.full` for compact chips or badges where a more capsule-like treatment is appropriate.

## Components
Buttons should be crisp, compact, and text-forward. `button-primary` and `button-secondary` both use `rounded.md`, 8px vertical padding, and 16px horizontal padding, with a fixed 38px height for consistency. Primary actions should feel slightly more prominent through surface contrast and hover treatment (`button-primary-hover`), while secondary and tertiary buttons remain restrained and low-chrome. Avoid oversized button chrome; the emphasis should come from spacing, contrast, and typography, not decoration.

Cards use `card` styling: dark surface, 1px border, 8px radius, and 16px padding. They should look like contained functional modules rather than lifted sheets. Inputs should follow the same visual language as cards, with dark backgrounds, clear text, and modest padding so they blend into the system. Chips use `rounded.full` and compact padding for tag-like metadata, especially in navigation, filters, and utility areas.

Code blocks and terminal panels should feel utilitarian and precise, with subtle surface differences and a quiet border. Tabs or segmented controls, if used, should stay low-contrast and rely on spacing and underline/active indicators instead of heavy fill. Icons should be monochrome by default, with violet reserved for active or branded emphasis.

## Do's and Don'ts
- Do keep the interface dark, restrained, and high-contrast, using white and muted grays for legibility.
- Do use violet sparingly but decisively for active states, highlights, and brand moments.
- Do preserve generous whitespace and large typographic hierarchy in hero areas.
- Do favor thin borders and surface shifts over shadows for separation.
- Don't introduce bright or saturated secondary hues that compete with the primary violet.
- Don't make buttons overly tall, glossy, or heavily shadowed.
- Don't compress the layout into dense blocks; the system should feel spacious and intentional.
- Don't use rounded corners larger than the established 8px pattern except for pills and chips.