// The `docvia init` brand banner: a grayscale ASCII wordmark over two tight
// lines of metadata. Kept deliberately small — logo, one-line pitch, then
// version/license/repo. Shown only on an interactive run so piped/CI output
// stays clean.
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

// Grayscale ramp — a soft near-white → mid-gray fade down the rows, matching
// the muted, monochrome look of the reference CLI. One 256-color code per row.
const RAMP = [252, 250, 248, 246, 244];
const PAD = "   ";
const DOT = ` ${c.dim("·")} `;

/** Print the `init` banner. No-op on non-interactive streams. */
export function printBanner(): void {
	if (!isInteractive()) return;
	const out = process.stdout;
	out.write("\n");
	WORDMARK.forEach((line, i) => {
		out.write(`${PAD}${fg256(RAMP[i] ?? 246, line)}\n`);
	});
	out.write(
		`\n${PAD}${c.dim("Typed Markdown documentation for any framework")}\n`,
	);
	out.write(
		`${PAD}${c.gray(`v${getVersion()}${DOT}MIT${DOT}github.com/kanakkholwal/docvia`)}\n`,
	);
}
