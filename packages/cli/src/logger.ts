// Tiny logger with ANSI colors. Honors NO_COLOR / FORCE_COLOR / non-TTY.
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
};

export const symbols = {
	tick: "✓",
	cross: "✗",
	diamond: "◆",
	arrow: "→",
};

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
