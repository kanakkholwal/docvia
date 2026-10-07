#!/usr/bin/env node
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
	addedPage,
	EDIT_ANCHOR,
	EDIT_SLUG,
	pageFile,
	writeCorpus,
} from "./lib/corpus.mjs";
import { browserSees, closeBrowser, newPage } from "./lib/browser.mjs";
import { packDocvia } from "./lib/docvia.mjs";
import { environment, installedVersions } from "./lib/env.mjs";
import { clientOutput, pageWeight } from "./lib/output.mjs";
import {
	fetchText,
	freePort,
	killAll,
	killTree,
	portOpen,
	run,
	runCapture,
	start,
	waitFor,
} from "./lib/process.mjs";
import { createResultsDir, writeResults } from "./lib/report.mjs";
import { summarize } from "./lib/stats.mjs";
import { measureWorkers } from "./lib/workers.mjs";
import { STACKS } from "./stacks/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

const { values: args } = parseArgs({
	options: {
		stacks: { type: "string" },
		pages: { type: "string", default: "300" },
		runs: { type: "string", default: "3" },
		out: { type: "string", default: join(here, "results") },
		keep: { type: "boolean", default: false },
		"skip-build": { type: "boolean", default: false },
		"skip-workers": { type: "boolean", default: false },
		list: { type: "boolean", default: false },
		json: { type: "boolean", default: false },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (args.help) {
	console.log(`Usage: node benchmarks/run.mjs [options]

  --stacks <ids>    Comma-separated stack ids (default: all; see --list)
  --pages <sizes>   Corpus sizes, e.g. 300,1500 (default: 300)
  --runs <n>        Measured runs per metric, after one warm-up (default: 3)
  --out <dir>       Results root (default: benchmarks/results)
  --keep            Keep the temporary apps for inspection
  --skip-build      Pack the already-built docvia packages
  --skip-workers    Skip the Cloudflare Workers build, bundle and workerd timings
  --list [--json]   Print the stacks; --json prints the ids a default run measures here`);
	process.exit(0);
}
const issueOf = (stack) =>
	stack.knownIssue ?? stack.platformIssues?.[process.platform];

if (args.list) {
	if (args.json) {
		// The stacks a default run measures on this platform: the CI matrix.
		console.log(
			JSON.stringify(STACKS.filter((s) => !issueOf(s)).map((s) => s.id)),
		);
	} else {
		for (const s of STACKS) {
			const issue = issueOf(s);
			console.log(
				`${s.id.padEnd(24)} ${s.tool} on ${s.framework} (${s.workers})${issue ? `  [skipped: ${issue}]` : ""}`,
			);
		}
	}
	process.exit(0);
}

const runs = Number(args.runs);
const sizes = args.pages.split(",").map(Number);
const wanted = args.stacks?.split(",") ?? STACKS.map((s) => s.id);
const unknown = wanted.filter((id) => !STACKS.some((s) => s.id === id));
if (unknown.length > 0 || !(runs >= 1) || sizes.some((n) => !(n > 0))) {
	console.error(
		`Invalid options${unknown.length ? `: unknown stack ${unknown.join(", ")}` : ""}`,
	);
	process.exit(2);
}
const stacks = STACKS.filter((s) => wanted.includes(s.id));
const pins = JSON.parse(readFileSync(join(here, "versions.json"), "utf8"));

mkdirSync(args.out, { recursive: true });
const { dir: resultsDir, name } = createResultsDir(args.out);
const work = mkdtempSync(join(tmpdir(), "docvia-bench-"));

function cleanup() {
	killAll();
	if (!args.keep) rmSync(work, { recursive: true, force: true });
}
for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		console.error(`\n${signal}: stopping servers and removing ${work}`);
		cleanup();
		process.exit(130);
	});
}

const log = (stack) => join(resultsDir, "logs", `${stack}.log`);
const step = (msg) =>
	console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const clear = (app, paths) => {
	for (const p of paths) rmSync(join(app, p), { recursive: true, force: true });
};

/** Times one production build per run, after a discarded warm-up build. */
async function measureBuild(stack, app) {
	const samples = [];
	for (let i = 0; i <= runs; i++) {
		clear(app, stack.caches);
		const ms = await run(stack.build, { cwd: app, log: log(stack.id) });
		if (i > 0) samples.push(ms);
	}
	return summarize(samples);
}

/** How long an edit or a new page may take to show up before it counts as not seen. */
const UPDATE_TIMEOUT_MS = 60_000;

/** One cold dev session: server ready, first page, an edit and a new page showing up. */
async function devSession(stack, app, round) {
	clear(app, stack.caches);
	const port = await freePort();
	const base = `http://localhost:${port}`;
	const docs = `${base}${stack.docsPath}`;
	const shape = { ext: stack.contentExt, layout: stack.contentLayout };
	const editFile = join(app, stack.contentDir, pageFile(EDIT_SLUG, shape));
	const original = readFileSync(editFile, "utf8");
	const addedSlug = `bench-added-${round}`;
	const addedFile = join(app, stack.contentDir, pageFile(addedSlug, shape));
	mkdirSync(dirname(addedFile), { recursive: true });

	// Client-rendered dev servers send an empty shell, so only a browser can see their content.
	const page = stack.devRendering === "client" ? await newPage() : undefined;
	const sees = (url, text, { label, timeoutMs, reload }) =>
		page
			? browserSees(page, url, text, { label, timeoutMs, reload })
			: waitFor(async () => (await fetchText(url)).text.includes(text), {
					label,
					timeoutMs,
				});

	const t0 = performance.now();
	const server = start(stack.dev(port), { cwd: app, log: log(stack.id) });
	try {
		await waitFor(() => portOpen(port), { label: `${stack.id} dev server` });
		const ready = performance.now() - t0;
		await sees(`${docs}/section-0/page-0`, "This page 0 explains", {
			label: `${stack.id} first page`,
		});
		const firstPage = performance.now() - t0;

		await sees(`${docs}/${EDIT_SLUG}`, "This page 5 explains", {
			label: `${stack.id} page to edit`,
		});
		const editMarker = `BENCHEDIT${round}X${Date.now()}`;
		writeFileSync(
			editFile,
			original.replace(EDIT_ANCHOR, `${editMarker}\n\n${EDIT_ANCHOR}`),
		);
		const edit = await sees(`${docs}/${EDIT_SLUG}`, editMarker, {
			label: `${stack.id} edit`,
			timeoutMs: UPDATE_TIMEOUT_MS,
		}).catch(() => null);

		const addMarker = `BENCHADD${round}X${Date.now()}`;
		writeFileSync(addedFile, addedPage(addMarker));
		const add = await sees(`${docs}/${addedSlug}`, addMarker, {
			label: `${stack.id} new page`,
			timeoutMs: UPDATE_TIMEOUT_MS,
			reload: true,
		}).catch(() => null);
		return { ready, firstPage, edit, add };
	} finally {
		await page?.close();
		killTree(server);
		writeFileSync(editFile, original);
		const added =
			stack.contentLayout === "routes" ? dirname(addedFile) : addedFile;
		rmSync(added, { recursive: true, force: true });
	}
}

/** Serves the last production build and weighs one docs page as a browser would load it. */
async function measurePage(stack, app) {
	const port = await freePort();
	const preview = stack.preview(port);
	const server =
		typeof preview === "string"
			? start(preview, { cwd: app, log: log(stack.id) })
			: start(preview.cmd, { cwd: app, env: preview.env, log: log(stack.id) });
	const url = `http://localhost:${port}${stack.docsPath}/section-0/page-0`;
	try {
		await waitFor(
			async () => (await fetchText(url)).text.includes("This page 0 explains"),
			{
				label: `${stack.id} production server`,
			},
		);
		return await pageWeight(url);
	} finally {
		killTree(server);
	}
}

async function measureDev(stack, app) {
	const sessions = [];
	for (let i = 0; i <= runs; i++) {
		const session = await devSession(stack, app, i);
		if (i > 0) sessions.push(session);
	}
	const pick = (key) => summarize(sessions.map((s) => s[key]));
	return {
		ready: pick("ready"),
		firstPage: pick("firstPage"),
		edit: pick("edit"),
		add: pick("add"),
	};
}

const results = {
	id: name,
	startedAt: new Date().toISOString(),
	options: { stacks: wanted, pages: sizes, runs },
	environment: environment(repo),
	pins,
	stacks: [],
};

let failed = false;
try {
	let docvia;
	if (stacks.some((s) => s.requiresDocvia)) {
		step("Building and packing docvia");
		docvia = await packDocvia({
			repo,
			work,
			log: log("docvia-pack"),
			skipBuild: args["skip-build"],
		});
	}

	for (const stack of stacks) {
		const entry = {
			id: stack.id,
			label: stack.label,
			tool: stack.tool,
			framework: stack.framework,
			workers: stack.workers,
			sizes: {},
		};
		results.stacks.push(entry);
		const issue = issueOf(stack);
		if (issue && !args.stacks) {
			entry.skipped = issue;
			step(`${stack.label}: skipped, ${issue}`);
			continue;
		}
		try {
			step(`${stack.label}: setting up`);
			const dir = join(work, stack.id);
			mkdirSync(dir, { recursive: true });
			const sh = (cmd, opts) => run(cmd, { ...opts, log: log(stack.id) });
			const capture = (cmd, opts) =>
				runCapture(cmd, { ...opts, log: log(stack.id) });
			const {
				app,
				timings,
				adjustments = [],
			} = await stack.setup({
				dir,
				sh,
				capture,
				pins,
				docvia,
				log: log(stack.id),
			});
			entry.setup = timings;
			entry.adjustments = adjustments;
			entry.versions = installedVersions(app, stack.versionsOf);

			for (const pages of sizes) {
				step(`${stack.label}: ${pages} pages, build x${runs + 1}`);
				writeCorpus(join(app, stack.contentDir), pages, {
					ext: stack.contentExt,
					layout: stack.contentLayout,
					docsPath: stack.docsPath,
				});
				const build = await measureBuild(stack, app);
				const output = clientOutput(join(app, stack.clientDir));
				const page = await measurePage(stack, app);
				step(`${stack.label}: ${pages} pages, dev x${runs + 1}`);
				const dev = await measureDev(stack, app);
				entry.sizes[pages] = { build, dev, output, page };
				// Written after every size, so a long run shows progress and survives a crash.
				writeResults(resultsDir, results);
			}

			// Last, because switching to the Cloudflare target changes the app's build setup.
			if (!args["skip-workers"]) {
				step(`${stack.label}: Cloudflare Workers`);
				try {
					entry.cloudflare = await measureWorkers(stack, app, {
						sh,
						capture,
						pins,
						log: log(stack.id),
					});
				} catch (err) {
					entry.cloudflare = {
						mode: stack.workers,
						error: err instanceof Error ? err.message : String(err),
					};
					killAll();
				}
				writeResults(resultsDir, results);
			}
		} catch (err) {
			failed = true;
			entry.error = err instanceof Error ? err.message : String(err);
			step(`${stack.label}: FAILED, ${entry.error}`);
			writeResults(resultsDir, results);
			killAll();
		}
	}
} finally {
	results.finishedAt = new Date().toISOString();
	writeResults(resultsDir, results);
	await closeBrowser();
	cleanup();
	step(`Results: ${resultsDir}`);
}
process.exitCode = failed ? 1 : 0;
