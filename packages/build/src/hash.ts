// Content & config hashing. Shared by the compile service for incremental
// cache keys and by the on-disk cache for compatibility checks.

import { xxh64 } from "@node-rs/xxhash";

export interface HashInputs {
	readonly fileContent: string;
	readonly frontmatter: string;
	readonly configHash: string;
	readonly pluginCacheKeys: string[];
	readonly dependencyHashes: string[];
}

export function computeContentHash(inputs: HashInputs): string {
	const composite = [
		inputs.fileContent,
		inputs.frontmatter,
		inputs.configHash,
		...inputs.pluginCacheKeys,
		...inputs.dependencyHashes,
	].join("\0");
	return xxh64(Buffer.from(composite)).toString(36);
}

/**
 * Stable JSON stringify — sorts object keys so the config hash is deterministic
 * regardless of property declaration order. Skips function values (plugins are
 * accounted for via pluginCacheKeys instead).
 */
export function stableStringify(value: unknown): string {
	if (value === null) return "null";
	if (typeof value === "function") return '"<fn>"';
	if (typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(",")}]`;
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	return `{${keys
		.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
		.join(",")}}`;
}

export function hashConfig(config: unknown): string {
	return xxh64(Buffer.from(stableStringify(config))).toString(36);
}
