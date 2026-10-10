// Prints spec failures by section: `npx tsx tests/report.ts [section] [limit]`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toHtml } from "../src/index";

const examples = JSON.parse(
	readFileSync(
		join(import.meta.dirname, "fixtures", "commonmark-0.31.2.json"),
		"utf8",
	),
) as Array<{
	markdown: string;
	html: string;
	example: number;
	section: string;
}>;
const [section, limit = "5"] = process.argv.slice(2);
const by = new Map<string, [number, number]>();
const failures: typeof examples = [];
for (const e of examples) {
	let out = "";
	try {
		out = toHtml(e.markdown, {
			html: true,
			gfm: false,
			directives: false,
			urlTransform: (u) => u,
		});
	} catch (err) {
		out = `THROW ${(err as Error).message}`;
	}
	const ok = out === e.html;
	const [p, t] = by.get(e.section) ?? [0, 0];
	by.set(e.section, [p + (ok ? 1 : 0), t + 1]);
	if (!ok && (!section || e.section === section))
		failures.push({
			...e,
			html: `${JSON.stringify(e.html)}\n   got ${JSON.stringify(out)}`,
		});
}
let total = 0;
for (const [s, [p, t]] of by) {
	total += p;
	if (p < t)
		console.log(`${String(p).padStart(3)}/${String(t).padEnd(3)} ${s}`);
}
console.log(`TOTAL ${total}/${examples.length}`);
if (section)
	for (const f of failures.slice(0, Number(limit)))
		console.log(
			`\n#${f.example} ${JSON.stringify(f.markdown)}\n want ${f.html}`,
		);
