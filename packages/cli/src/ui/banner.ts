// The `docvia init` brand banner: an ASCII wordmark with a cyan→blue gradient
// over three tight lines of metadata. Kept deliberately small — logo, one-line
// pitch, version/author/license, repo. Shown only on an interactive run so
// piped/CI output stays clean.
import { c, fg256 } from "../logger";
import { getVersion } from "../version";
import { isInteractive } from "./core";

// Each letter is a 5-row grid; the wordmark is assembled column-wise so kerning
// can never drift out of sync between rows.
const GLYPHS: Record<string, readonly string[]> = {
	d: ["     _ ", "  __| |", " / _` |", "| (_| |", " \\__,_|"],
	o: ["       ", "  ___  ", " / _ \\ ", "| (_) |", " \\___/ "],
	c: ["      ", "  ___ ", " / __|", "| (__ ", " \\___|"],
	v: ["       ", "__   __", "\\ \\ / /", " \\ V / ", "  \\_/  "],
	i: [" _ ", "(_)", "| |", "| |", "|_|"],
	a: ["       ", "  __ _ ", " / _` |", "| (_| |", " \\__,_|"],
};

const ROWS = 5;
const WORDMARK: string[] = Array.from({ length: ROWS }, (_, r) =>
	"docvia"
		.split("")
		.map((ch) => GLYPHS[ch]?.[r] ?? "")
		.join(""),
);

// Cyan → blue diagonal ramp, one 256-color code per row.
const RAMP = [51, 45, 39, 33, 27];
const PAD = "   ";

/** Print the `init` banner. No-op on non-interactive streams. */
export function printBanner(): void {
	if (!isInteractive()) return;
	const out = process.stdout;
	out.write("\n");
	WORDMARK.forEach((line, i) => {
		out.write(`${PAD}${fg256(RAMP[i] ?? 39, line)}\n`);
	});
	out.write(`\n${PAD}${c.dim("Build-time Markdown documentation compiler")}\n`);
	out.write(
		`${PAD}${c.gray(`v${getVersion()}  ${c.dim("·")}  by kanakkholwal  ${c.dim("·")}  MIT`)}\n`,
	);
	out.write(`${PAD}${c.gray("github.com/kanakkholwal/docvia")}\n`);
}
