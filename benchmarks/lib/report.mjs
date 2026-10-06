import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatKB, formatMs } from "./stats.mjs";

const pad = (n) => String(n).padStart(2, "0");

/** Results folder name in local time, e.g. `2026-10-06_09-14-pm`; a suffix avoids clashes. */
export function createResultsDir(root, date = new Date()) {
	const hours = date.getHours();
	const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(hours % 12 || 12)}-${pad(date.getMinutes())}-${hours < 12 ? "am" : "pm"}`;
	let name = base;
	for (let n = 2; existsSync(join(root, name)); n++) name = `${base}-${n}`;
	const dir = join(root, name);
	mkdirSync(join(dir, "logs"), { recursive: true });
	return { dir, name };
}

function markdown(results) {
	const { environment: env } = results;
	const lines = [
		`# Benchmark ${results.id}`,
		"",
		`- Machine: ${env.machine.cpu}, ${env.machine.threads} threads, ${env.machine.ramGB} GB RAM, ${env.machine.os}${env.machine.ci ? ` (CI: ${env.machine.ci})` : ""}`,
		`- Node ${env.node}, pnpm ${env.pnpm}, git ${env.git.sha?.slice(0, 7)}${env.git.dirty ? " (dirty)" : ""}`,
		`- Median of ${results.options.runs} runs; logs in \`logs/\``,
		"",
	];
	for (const pages of results.options.pages) {
		lines.push(
			`## ${pages} pages`,
			"",
			"| Stack | Build | Dev ready | First page | Edit visible | New page | Client JS (gzip) | CSS (gzip) |",
			"|---|---|---|---|---|---|---|---|",
		);
		for (const stack of results.stacks) {
			const r = stack.sizes?.[pages];
			if (!r) {
				lines.push(
					`| ${stack.label} | failed: ${stack.error ?? "no result"} |||||||`,
				);
				continue;
			}
			lines.push(
				`| ${stack.label} | ${formatMs(r.build.median)} | ${formatMs(r.dev.ready.median)} | ${formatMs(r.dev.firstPage.median)} | ${formatMs(r.dev.edit.median)} | ${formatMs(r.dev.add.median)} | ${formatKB(r.output.jsGzip)} | ${formatKB(r.output.cssGzip)} |`,
			);
		}
		lines.push("");
	}
	lines.push(
		"## Setup",
		"",
		"| Stack | Create | Install | Add docs | Versions |",
		"|---|---|---|---|---|",
	);
	for (const stack of results.stacks) {
		const s = stack.setup ?? {};
		const versions = Object.entries(stack.versions ?? {})
			.map(([k, v]) => `${k}@${v}`)
			.join(", ");
		lines.push(
			`| ${stack.label} | ${formatMs(s.createMs)} | ${formatMs(s.installMs)} | ${formatMs(s.docsMs)} | ${versions} |`,
		);
	}
	return `${lines.join("\n")}\n`;
}

export function writeResults(dir, results) {
	writeFileSync(
		join(dir, "results.json"),
		`${JSON.stringify(results, null, "\t")}\n`,
	);
	writeFileSync(join(dir, "results.md"), markdown(results));
}
