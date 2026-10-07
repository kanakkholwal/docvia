import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import {
	fetchText,
	freePort,
	killTree,
	portOpen,
	runCapture,
	start,
	waitFor,
} from "./process.mjs";
import { summarize } from "./stats.mjs";

/** Cloudflare's compressed Worker size limits, in KiB. */
export const WORKER_LIMITS_KIB = { free: 3 * 1024, paid: 10 * 1024 };

/** Bundles the Worker exactly as a deploy would, without uploading, and reads wrangler's sizes. */
async function bundle({ cwd, wrangler, log, args }) {
	const outdir = mkdtempSync(join(tmpdir(), "docvia-worker-"));
	try {
		const { output } = await runCapture(
			`${wrangler} deploy --dry-run --outdir "${outdir}"${args}`,
			{ cwd, log },
		);
		const size =
			/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/.exec(
				output,
			);
		if (!size) throw new Error("wrangler did not report an upload size");
		return { uploadKiB: Number(size[1]), gzipKiB: Number(size[2]) };
	} finally {
		rmSync(outdir, { recursive: true, force: true });
	}
}

/**
 * Runs the Worker in workerd (`wrangler dev`) and times the first docs request, which pays for
 * module evaluation in a fresh isolate, then `requests` warm requests across different pages.
 */
async function timings({ cwd, wrangler, log, args, docsPath, requests }) {
	const port = await freePort();
	const server = start(`${wrangler} dev --port ${port} --ip localhost${args}`, {
		cwd,
		log,
	});
	const url = (i) =>
		`http://localhost:${port}${docsPath}/section-${i % 10}/page-${i}`;
	try {
		await waitFor(() => portOpen(port), { label: "wrangler dev" });
		const t0 = performance.now();
		await waitFor(
			async () =>
				(await fetchText(url(0))).text.includes("This page 0 explains"),
			{ label: "first Worker response", timeoutMs: 120_000 },
		);
		const cold = performance.now() - t0;
		const warm = [];
		for (let i = 1; i <= requests; i++) {
			const t = performance.now();
			const { status } = await fetchText(url(i));
			if (status !== 200)
				throw new Error(`Worker answered ${status} for ${url(i)}`);
			warm.push(performance.now() - t);
		}
		return { coldMs: Math.round(cold), warm: summarize(warm) };
	} finally {
		killTree(server);
	}
}

/** Switches the app to its Cloudflare target with the stack's CLI steps, then measures it. */
export async function measureWorkers(stack, app, { sh, capture, pins, log }) {
	const target = stack.workersTarget;
	if (!target) return { mode: stack.workers, skipped: "static assets only" };
	const platformIssue = target.platformIssues?.[process.platform];
	if (platformIssue) return { mode: stack.workers, skipped: platformIssue };
	if (target.unsupported)
		return { mode: stack.workers, skipped: target.unsupported };

	await target.setup?.({ app, sh, capture, pins });
	await runCapture(target.build, { cwd: app, env: target.env ?? {}, log });
	const options = {
		cwd: join(app, target.cwd ?? "."),
		wrangler: `pnpm dlx wrangler@${pins.wrangler}`,
		args: [
			target.config ? ` --config ${target.config}` : "",
			// Nitro writes today's date, which the pinned workerd may not support yet.
			target.pinCompatibilityDate
				? ` --compatibility-date ${pins.workerdCompatibilityDate}`
				: "",
		].join(""),
		log,
	};
	const size = await bundle(options);
	const run = await timings({
		...options,
		docsPath: stack.docsPath,
		requests: 30,
	});
	return {
		mode: stack.workers,
		...size,
		fitsFree: size.gzipKiB <= WORKER_LIMITS_KIB.free,
		fitsPaid: size.gzipKiB <= WORKER_LIMITS_KIB.paid,
		...run,
	};
}
