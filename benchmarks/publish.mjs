#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "apps/web/src/lib/benchmarks/setup.json");

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		"allow-dirty": { type: "boolean", default: false },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (args.help) {
	console.log(`Usage: node benchmarks/publish.mjs [results-dir] [--allow-dirty]

Writes the docvia setup numbers from a results folder (default: the newest run) to
apps/web/src/lib/benchmarks/setup.json, which the homepage reads.`);
	process.exit(0);
}

function newestResults() {
	const root = join(here, "results");
	if (!existsSync(root)) return undefined;
	// Folder names sort by date but not by am/pm, so order by when each run started.
	return readdirSync(root, { withFileTypes: true })
		.filter(
			(d) => d.isDirectory() && existsSync(join(root, d.name, "results.json")),
		)
		.map((d) => {
			const dir = join(root, d.name);
			const { startedAt } = JSON.parse(
				readFileSync(join(dir, "results.json"), "utf8"),
			);
			return { dir, startedAt };
		})
		.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
		.at(-1)?.dir;
}

function refuse(dir, problems) {
	console.error(`publish: refusing ${dir}`);
	for (const p of problems) console.error(`- ${p}`);
	process.exit(1);
}

const dir = positionals[0] ?? newestResults();
if (!dir || !existsSync(join(dir, "results.json"))) {
	console.error("publish: no results found; run `pnpm bench` first");
	process.exit(1);
}
const results = JSON.parse(readFileSync(join(dir, "results.json"), "utf8"));
const docvia = results.stacks.filter((s) => s.tool === "docvia");

const problems = [];
if (docvia.length === 0) problems.push("the run has no docvia stacks");
for (const s of docvia) {
	if (s.error) problems.push(`${s.label} failed: ${s.error}`);
	else if (!s.setup?.initMs)
		problems.push(`${s.label} has no docvia init timing`);
}
if (results.options.runs < 3) {
	problems.push(
		`only ${results.options.runs} run(s); publishing needs at least 3`,
	);
}
if (results.environment.git.dirty && !args["allow-dirty"]) {
	problems.push(
		"the run was made from uncommitted changes (--allow-dirty overrides)",
	);
}
if (problems.length > 0) refuse(dir, problems);

const published = {
	date: results.startedAt.slice(0, 10),
	source: `benchmarks/results/${results.id}`,
	git: results.environment.git.sha,
	machine: { ...results.environment.machine, node: results.environment.node },
	frameworks: docvia.map((s) => ({
		framework: s.framework,
		version: Object.values(s.versions)[0],
		initMs: Math.round(s.setup.initMs),
		installMs: Math.round(s.setup.initInstallMs ?? 0),
		files: s.setup.initFiles,
	})),
};

writeFileSync(target, `${JSON.stringify(published, null, "\t")}\n`);
console.log(`publish: ${results.id} -> ${target}`);
