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

/** Anything beyond the starter's own CLI that a stack needed, so no workaround stays hidden. */
function extraSteps(stack) {
	const steps = [...(stack.adjustments ?? [])];
	if (stack.setup?.approveBuildsMs !== undefined) {
		steps.unshift(
			`pnpm approve-builds (${formatMs(stack.setup.approveBuildsMs)})`,
		);
	}
	return steps.length > 0 ? steps.join("; ") : "none";
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
			"| Stack | Build | Dev ready | First page | Edit visible | New page | Page HTML (gzip) | Page JS (gzip) | Page CSS (gzip) | Build JS total (gzip) |",
			"|---|---|---|---|---|---|---|---|---|---|",
		);
		for (const stack of results.stacks) {
			const r = stack.sizes?.[pages];
			if (!r) {
				lines.push(
					`| ${stack.label} | ${stack.skipped ? `skipped: ${stack.skipped}` : `failed: ${stack.error ?? "no result"}`} |||||||||`,
				);
				continue;
			}
			lines.push(
				`| ${stack.label} | ${formatMs(r.build.median)} | ${formatMs(r.dev.ready.median)} | ${formatMs(r.dev.firstPage.median)} | ${formatMs(r.dev.edit.median)} | ${formatMs(r.dev.add.median)} | ${formatKB(r.page.htmlGzip)} | ${formatKB(r.page.jsGzip)} | ${formatKB(r.page.cssGzip)} | ${formatKB(r.output.jsGzip)} |`,
			);
		}
		lines.push("");
	}
	const measured = results.stacks.filter((s) => s.cloudflare);
	if (measured.length > 0) {
		lines.push(
			`## Cloudflare Workers (${Math.max(...results.options.pages)} pages)`,
			"",
			"Bundle is the Worker script wrangler uploads; prerendered pages ship as static assets and are",
			"not counted. Timings run in workerd via `wrangler dev`: the first request pays module evaluation.",
			"",
			"| Stack | Bundle (gzip) | Fits free 3 MB / paid 10 MB | Cold first request | Warm p50 | Warm p95 |",
			"|---|---|---|---|---|---|",
		);
		for (const stack of measured) {
			const w = stack.cloudflare;
			if (w.skipped || w.error) {
				lines.push(
					`| ${stack.label} | ${w.skipped ? `not measured: ${w.skipped}` : `failed: ${w.error}`} |||||`,
				);
				continue;
			}
			const fits = `${w.fitsFree ? "yes" : "no"} / ${w.fitsPaid ? "yes" : "no"}`;
			lines.push(
				`| ${stack.label} | ${w.gzipKiB} KiB | ${fits} | ${formatMs(w.coldMs)} | ${formatMs(w.warm.median)} | ${formatMs(w.warm.p95)} |`,
			);
		}
		lines.push("");
	}
	lines.push(
		"## Setup",
		"",
		"| Stack | Create | Install | docvia init (its install) | Files | Extra steps | Versions |",
		"|---|---|---|---|---|---|---|",
	);
	for (const stack of results.stacks) {
		const s = stack.setup ?? {};
		const versions = Object.entries(stack.versions ?? {})
			.map(([k, v]) => `${k}@${v}`)
			.join(", ");
		lines.push(
			`| ${stack.label} | ${formatMs(s.createMs)} | ${formatMs(s.installMs)} | ${s.initMs === undefined ? "n/a" : `${formatMs(s.initMs)} (${formatMs(s.initInstallMs)})`} | ${s.initFiles ?? "n/a"} | ${extraSteps(stack)} | ${versions} |`,
		);
	}
	return `${lines.join("\n")}\n`;
}

/** JSON first, so a bug in the Markdown summary can never cost a run its data. */
export function writeResults(dir, results) {
	writeFileSync(
		join(dir, "results.json"),
		`${JSON.stringify(results, null, "\t")}\n`,
	);
	try {
		writeFileSync(join(dir, "results.md"), markdown(results));
	} catch (err) {
		console.error(`results.md not written: ${err.message}`);
	}
}
