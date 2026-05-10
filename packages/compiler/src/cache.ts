// Incremental build cache. Persisted to <outDir>/.cache.json.
// Tracks per-file content hashes plus the config hash and tool version. A file
// is considered "fresh" when (fileHash, configHash, toolVersion, pluginKeys)
// all match the previous run.

import type { PageMeta } from "@docvia/ir";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const CACHE_FILE = ".docvia.cache.json";
// Bump this whenever the on-disk shape changes incompatibly.
export const CACHE_VERSION = 1;

export interface CachedEntry {
	readonly fileHash: string;
	readonly contentHash: string;
	readonly page: PageMeta;
	readonly route: string;
}

export interface CacheFile {
	readonly version: number;
	readonly toolVersion: string;
	readonly configHash: string;
	readonly pluginKeys: readonly string[];
	readonly entries: Record<string, CachedEntry>;
}

export async function readCache(outDir: string): Promise<CacheFile | null> {
	try {
		const raw = await readFile(join(outDir, CACHE_FILE), "utf-8");
		const parsed = JSON.parse(raw) as CacheFile;
		if (parsed.version !== CACHE_VERSION) return null;
		return parsed;
	} catch {
		return null;
	}
}

export async function writeCache(
	outDir: string,
	cache: CacheFile,
): Promise<void> {
	await writeFile(
		join(outDir, CACHE_FILE),
		JSON.stringify(cache, null, 2),
		"utf-8",
	);
}

/**
 * Returns true if the previous cache is compatible (same toolVersion, same
 * configHash, same plugin cache keys). When incompatible, callers should treat
 * every file as "must rebuild" and discard cached entries.
 */
export function cacheIsCompatible(
	prev: CacheFile | null,
	toolVersion: string,
	configHash: string,
	pluginKeys: readonly string[],
): boolean {
	if (!prev) return false;
	if (prev.toolVersion !== toolVersion) return false;
	if (prev.configHash !== configHash) return false;
	if (prev.pluginKeys.length !== pluginKeys.length) return false;
	for (let i = 0; i < pluginKeys.length; i++) {
		if (prev.pluginKeys[i] !== pluginKeys[i]) return false;
	}
	return true;
}
