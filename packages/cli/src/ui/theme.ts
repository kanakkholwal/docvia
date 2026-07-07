// Visual vocabulary for the interactive CLI toolkit.
//
// The look is a left-hand "rail" — a vertical │ that connects every step of a
// flow, opened by ┌ (intro) and closed by └ (outro). It reads as one continuous
// panel instead of a stream of disconnected log lines. Everything here is a few
// box-drawing glyphs plus the colors from `logger` — no dependency, no bundle
// cost, and a consistent style build/dev already share.
import { c } from "../logger";

/** Step lifecycle — drives which glyph and color a prompt's header shows. */
export type StepStatus = "active" | "submit" | "cancel";

/** Box-drawing + marker glyphs. Kept together so the rail stays consistent. */
export const S = {
	// The vertical rail and its end caps.
	bar: "│",
	barStart: "┌",
	barEnd: "└",
	// Step header markers (left of a prompt's message).
	active: "◆",
	submit: "◇",
	cancel: "■",
	// Single-choice markers.
	radioOn: "●",
	radioOff: "○",
	// Multi-choice markers.
	checkOn: "◼",
	checkOff: "◻",
	// Inline separators.
	pointer: "›",
	// Spinner frames (braille — smooth and widely supported).
	spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
} as const;

/** Raw cursor-control sequences (bare — callers write these to stdout). */
export const cursor = {
	hide: "\x1b[?25l",
	show: "\x1b[?25h",
} as const;

/** A gray rail segment, optionally carrying content: `│  text`. */
export function bar(text = ""): string {
	return text ? `${c.gray(S.bar)}  ${text}` : c.gray(S.bar);
}

/** The colored step glyph for a given lifecycle status. */
export function stepGlyph(status: StepStatus): string {
	if (status === "submit") return c.green(S.submit);
	if (status === "cancel") return c.red(S.cancel);
	return c.cyan(S.active);
}

/** A prompt's header line: `◆  Message`. */
export function head(status: StepStatus, message: string): string {
	return `${stepGlyph(status)}  ${message}`;
}

/**
 * The collapsed one-line summary a prompt shows after it resolves:
 *
 *   ◇  Renderer  ›  react
 *   │
 *
 * The trailing rail segment provides the gap to the next step.
 */
export function summary(
	status: StepStatus,
	message: string,
	value: string,
): string {
	const shown = status === "cancel" ? c.dim(value) : c.cyan(value);
	return `${head(status, message)}  ${c.dim(S.pointer)} ${shown}\n${bar()}`;
}
