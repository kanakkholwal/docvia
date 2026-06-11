// @docvia/runtime — the stateful compile service shared by build, dev, and SSR.

export type { CachedEntry, CacheFile } from "./cache";
export {
	CACHE_FILE,
	CACHE_VERSION,
	cacheIsCompatible,
	readCache,
	writeCache,
} from "./cache";
export type {
	CompiledModule,
	CompileMarkdownToModuleArgs,
} from "./compile-module";
export { compileMarkdownToModule } from "./compile-module";
export type { CollectionData, EmitModuleGraphArgs, RouteFile } from "./emit";
export {
	emitModuleGraphFiles,
	emitTypeDeclarations,
	generateVirtualSource,
	warnInvalidShikiLangs,
} from "./emit";
export { compileParallel, readFileEntry, readFileTree } from "./fs";
export type { HashInputs } from "./hash";
export { computeContentHash, hashConfig, stableStringify } from "./hash";
export type { InvalidationResult, ServiceEntry } from "./service";
export { CompileService, TOOL_VERSION } from "./service";
