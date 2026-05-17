// Tiny logger with ANSI colors. Honors NO_COLOR / FORCE_COLOR / non-TTY.
// Intentionally dependency-free — a hand-rolled ~30 lines of ANSI beats
// pulling another package into the supply chain.
import { docviaError } from "@docvia/ir";

const enabled =
	process.env.FORCE_COLOR === "1" ||
	(process.stdout.isTTY === true && process.env.NO_COLOR !== "1");

const ansi = (code: string, s: string) =>
	enabled ? `\x1b[${code}m${s}\x1b[0m` : s;

export const c = {
	red: (s: string) => ansi("31", s),
	green: (s: string) => ansi("32", s),
	yellow: (s: string) => ansi("33", s),
	blue: (s: string) => ansi("34", s),
	cyan: (s: string) => ansi("36", s),
	gray: (s: string) => ansi("90", s),
	bold: (s: string) => ansi("1", s),
	dim: (s: string) => ansi("2", s),
};

export const symbols = {
	tick: "✓",
	cross: "✗",
	diamond: "◆",
	arrow: "→",
	dot: "·",
};

/** Human-readable duration. */
export function fmtMs(ms: number): string {
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/** A command banner, e.g. `$ docvia build`. */
export function header(cmd: string): void {
	console.log(`\n${c.gray("$")} ${c.bold(`docvia ${cmd}`)}\n`);
}

// Column at which the right-aligned step timing ends.
const STEP_WIDTH = 52;

/**
 * One completed step of a multi-stage command — a ticked label, a muted
 * detail, and a right-aligned duration:
 *
 *   ✓ compile   docs · 24 files                 38ms
 *
 * Padding is measured from the *uncolored* text so ANSI codes never skew
 * the alignment.
 */
export function step(label: string, detail: string, ms?: number): void {
	const time = ms === undefined ? "" : fmtMs(ms);
	const plainLen = 4 + Math.max(label.length, 8) + 1 + detail.length;
	const pad = Math.max(2, STEP_WIDTH - plainLen - time.length);
	console.log(
		`  ${c.green(symbols.tick)} ${c.bold(label.padEnd(8))} ` +
			`${c.gray(detail)}${" ".repeat(pad)}${c.gray(time)}`,
	);
}

export function formatError(err: unknown): string {
	if (err instanceof docviaError) {
		const loc = err.loc ? `:${err.loc.line}:${err.loc.column}` : "";
		const file = err.file ? `\n  ${symbols.arrow} ${err.file}${loc}` : "";
		return `${c.red(`[${err.code}]`)} ${err.message}${file}`;
	}
	const e = err as Error;
	return `${c.red("[ERROR]")} ${e?.message ?? String(err)}`;
}

export const log = {
	info: (msg: string) => console.log(`${c.cyan(symbols.diamond)} ${msg}`),
	success: (msg: string) => console.log(`${c.green(symbols.tick)} ${msg}`),
	warn: (msg: string) => console.warn(`${c.yellow("!")} ${msg}`),
	error: (msg: string) => console.error(msg),
	plain: (msg: string) => console.log(msg),
};
