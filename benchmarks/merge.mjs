#!/usr/bin/env node
import {
	cpSync,
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createResultsDir, writeResults } from "./lib/report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		out: { type: "string", default: join(here, "results") },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (args.help || positionals.length === 0) {
	console.log(`Usage: node benchmarks/merge.mjs <dir>... [--out <dir>]

Combines results.json files found under the given folders (one per CI runner, say) into one
timestamped results folder with a single report. Exits non-zero if any stack failed.`);
	process.exit(positionals.length === 0 && !args.help ? 2 : 0);
}

/** Every folder under `dir` (itself included) that holds a `results.json`. */
function findRuns(dir) {
	if (existsSync(join(dir, "results.json"))) return [dir];
	return readdirSync(dir)
		.map((name) => join(dir, name))
		.filter((path) => statSync(path).isDirectory())
		.flatMap(findRuns);
}

const runs = positionals.flatMap(findRuns).map((dir) => ({
	dir,
	results: JSON.parse(readFileSync(join(dir, "results.json"), "utf8")),
}));
if (runs.length === 0) {
	console.error("merge: no results.json found");
	process.exit(1);
}

const [first] = runs;
const mismatch = runs.find(
	({ results }) =>
		results.options.runs !== first.results.options.runs ||
		results.options.pages.join() !== first.results.options.pages.join(),
);
if (mismatch) {
	console.error(`merge: ${mismatch.dir} used different --pages or --runs`);
	process.exit(1);
}

const { dir, name } = createResultsDir(args.out);
const stacks = runs.flatMap(({ results }) =>
	// Each runner is its own machine, so the environment travels with its stacks.
	results.stacks.map((stack) => ({
		...stack,
		environment: results.environment,
	})),
);
const merged = {
	id: name,
	startedAt: runs.map((r) => r.results.startedAt).sort()[0],
	finishedAt: runs
		.map((r) => r.results.finishedAt)
		.sort()
		.at(-1),
	options: { ...first.results.options, stacks: stacks.map((s) => s.id) },
	environment: first.results.environment,
	pins: first.results.pins,
	sources: runs.map((r) => r.results.id),
	stacks,
};

for (const run of runs) {
	const logs = join(run.dir, "logs");
	if (existsSync(logs)) cpSync(logs, join(dir, "logs"), { recursive: true });
}
writeResults(dir, merged);
console.log(
	`merge: ${runs.length} run(s), ${stacks.length} stack(s) -> ${dir}`,
);
process.exitCode = stacks.some((s) => s.error) ? 1 : 0;
