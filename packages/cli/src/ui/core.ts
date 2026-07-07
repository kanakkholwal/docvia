// The interactive engine behind every prompt.
//
// A prompt is fully described by two functions: `frame(status)` renders the
// current view as a (multi-line) string, and `onKey(key, ctx)` mutates the
// prompt's own state in response to a keystroke. `runPrompt` owns the terminal
// machinery around them — raw mode, keypress decoding, redraw, cursor, and
// Ctrl+C — so individual prompts stay declarative.
//
// Redraw strategy: remember how many lines the last frame occupied, move the
// cursor back up that many rows, clear to the end of the screen, and repaint.
// Frames are kept short (one line per option) so they never soft-wrap and throw
// the line count off.
import { emitKeypressEvents } from "node:readline";
import { cursor, type StepStatus } from "./theme";

/** A decoded keypress, as delivered by node:readline's `keypress` event. */
export interface Key {
	name?: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	sequence?: string;
}

/** Thrown when the user aborts a prompt (Ctrl+C or Escape). */
export class PromptCancelled extends Error {
	constructor() {
		super("Prompt cancelled");
		this.name = "PromptCancelled";
	}
}

/**
 * True when we can safely drive an interactive prompt: both ends are a TTY and
 * we're not in a CI environment. Callers use this to fall back to defaults
 * (headless scaffolding, piped output) without ever blocking on input.
 */
export function isInteractive(): boolean {
	return (
		process.stdin.isTTY === true &&
		process.stdout.isTTY === true &&
		process.env.CI !== "true"
	);
}

/** Actions a prompt's key handler can trigger to end the loop. */
export interface PromptActions {
	submit(): void;
	cancel(): void;
}

export interface PromptSpec {
	/** Render the whole prompt for the given lifecycle status. */
	frame(status: StepStatus): string;
	/** Handle a keystroke; mutate state and/or call `ctx.submit()/cancel()`. */
	onKey(key: Key, ctx: PromptActions): void;
}

/**
 * Run one prompt to completion. Resolves when the prompt submits; rejects with
 * {@link PromptCancelled} when the user aborts. Assumes an interactive TTY —
 * guard with {@link isInteractive} before calling.
 */
export function runPrompt(spec: PromptSpec): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const input = process.stdin;
		const out = process.stdout;

		emitKeypressEvents(input);
		const wasRaw = input.isRaw === true;
		if (input.isTTY) input.setRawMode(true);
		input.resume();
		out.write(cursor.hide);

		let status: StepStatus = "active";
		let prevLines = 0;
		let settled = false;

		const paint = (): void => {
			const frame = spec.frame(status);
			if (prevLines > 0) out.write(`\x1b[${prevLines}A`);
			out.write("\x1b[0J"); // clear from cursor to end of screen
			out.write(`${frame}\n`);
			prevLines = frame.split("\n").length;
		};

		const teardown = (): void => {
			input.off("keypress", onKeypress);
			if (input.isTTY) input.setRawMode(wasRaw);
			input.pause();
			out.write(cursor.show);
		};

		const finish = (next: StepStatus, done: () => void): void => {
			if (settled) return;
			settled = true;
			status = next;
			paint(); // final repaint in the resolved (collapsed) state
			teardown();
			done();
		};

		const ctx: PromptActions = {
			submit: () => finish("submit", resolve),
			cancel: () => finish("cancel", () => reject(new PromptCancelled())),
		};

		const onKeypress = (_str: string | undefined, key: Key = {}): void => {
			// Universal aborts, handled before the prompt sees the key.
			if ((key.ctrl && key.name === "c") || key.name === "escape") {
				ctx.cancel();
				return;
			}
			spec.onKey(key, ctx);
			if (!settled) paint();
		};

		input.on("keypress", onKeypress);
		paint();
	});
}
