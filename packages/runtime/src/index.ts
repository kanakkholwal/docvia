// @docvia/runtime — the stateful compile service shared by build, dev, and SSR.

export type { CachedEntry, CacheFile } from "./cache";
export {
	CACHE_FILE,
	CACHE_VERSION,
	cacheIsCompatible,
	readCache,
	writeCache,
} from "./cache";
export type { CollectionData, EmitModuleGraphArgs } from "./emit";
export { emitModuleGraphFiles, warnInvalidShikiLangs } from "./emit";
export { compileParallel, readFileEntry, readFileTree } from "./fs";
export type { HashInputs } from "./hash";
export { computeContentHash, hashConfig, stableStringify } from "./hash";
export type { ServiceEntry } from "./service";
export { CompileService, TOOL_VERSION } from "./service";
