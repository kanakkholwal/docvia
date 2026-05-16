// Filesystem scanning and bounded concurrency helpers for the compile service.

import { readdir, readFile } from "node:fs/promises";
import { cpus } from "node:os";
import { extname, join, relative } from "node:path";
import type { FileEntry } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { xxh64 } from "@node-rs/xxhash";

const FILE_READ_CONCURRENCY = Math.max(4, cpus().length);

/** Read one markdown file into a FileEntry, hashing its contents. */
export async function readFileEntry(
	filePath: string,
	relativePath: string,
): Promise<FileEntry> {
	const content = await readFile(filePath, "utf-8");
	const hash = xxh64(Buffer.from(content)).toString(36);
	return { path: filePath, relativePath, content, hash };
}

/** Recursively collect every `.md` file under `dir` as a FileEntry. */
export async function readFileTree(dir: string): Promise<FileEntry[]> {
	const entries: FileEntry[] = [];
	const dirsToWalk: string[] = [dir];

	// Parallelized BFS — read directories in batches; for each batch, parallel
	// readdir then collect files and queue subdirectories.
	while (dirsToWalk.length > 0) {
		const batch = dirsToWalk.splice(0, FILE_READ_CONCURRENCY);
		const listings = await Promise.all(
			batch.map(async (d) => {
				try {
					return [d, await readdir(d, { withFileTypes: true })] as const;
				} catch (err) {
					throw new docviaError(
						"PARSE_ERROR",
						`Failed to read directory: ${d}`,
						d,
						undefined,
						err as Error,
					);
				}
			}),
		);

		const filePaths: { full: string; rel: string }[] = [];
		for (const [d, items] of listings) {
			for (const item of items) {
				const full = join(d, item.name);
				if (item.isDirectory()) {
					dirsToWalk.push(full);
				} else if (item.isFile() && extname(item.name) === ".md") {
					filePaths.push({
						full,
						rel: relative(dir, full).replace(/\\/g, "/"),
					});
				}
			}
		}

		// Read file contents in parallel
		const reads = await Promise.all(
			filePaths.map(({ full, rel }) => readFileEntry(full, rel)),
		);
		entries.push(...reads);
	}

	return entries;
}

/** Run `fn` over `items` with a bounded number of concurrent workers. */
export async function compileParallel<T>(
	items: readonly T[],
	fn: (item: T) => Promise<void>,
	concurrency = Math.max(1, cpus().length - 1),
): Promise<void> {
	let index = 0;
	const workers = Array.from(
		{ length: Math.min(concurrency, items.length) || 1 },
		async () => {
			while (true) {
				const i = index++;
				if (i >= items.length) break;
				await fn(items[i] as T);
			}
		},
	);
	await Promise.all(workers);
}
