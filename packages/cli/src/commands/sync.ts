import { relative } from "node:path";
import { performance } from "node:perf_hooks";
import { docviaError } from "@docvia/ir";
import { syncTypes } from "@docvia/runtime";
import { c, fmtMs, formatError, header, log, symbols } from "../logger";

export interface SyncOptions {
	config?: string;
}

/** Write `.docvia/types.d.ts` + `.docvia/env.d.ts` without a bundler, for CI type checks. */
export async function runSync(opts: SyncOptions): Promise<void> {
	header("sync");
	const t0 = performance.now();
	try {
		const { outDir, pages } = await syncTypes({ configPath: opts.config });
		console.log(
			`  ${c.green(symbols.tick)} ${c.bold(`Typed ${pages} page${pages === 1 ? "" : "s"}`)} ${c.gray(
				`into ${relative(process.cwd(), outDir) || "."} in ${fmtMs(performance.now() - t0)}`,
			)}`,
		);
	} catch (err) {
		log.error(`  ${formatError(err)}`);
		if (err instanceof docviaError && err.cause) {
			log.error(c.gray(String(err.cause.stack ?? err.cause.message)));
		}
		process.exit(1);
	}
}
