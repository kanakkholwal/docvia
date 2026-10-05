// @docvia/runtime: the page pipeline shared by every integration.

export type { ResolvedCollection } from "./collections";
export {
	assertCollectionDirs,
	assertComponentsExist,
	locate,
	resolveCollections,
} from "./collections";
export type {
	CompiledModule,
	CompileMarkdownToModuleArgs,
} from "./compile-module";
export { compileMarkdownToModule } from "./compile-module";
export type { CollectionData, EmitModuleGraphArgs, IndexedPage } from "./emit";
export {
	emitModuleGraphFiles,
	emitTypeDeclarations,
	generateVirtualRegistry,
	generateVirtualSource,
	resolveComponents,
	warnInvalidShikiLangs,
	writeIfChanged,
} from "./emit";
export { compileParallel, readFileEntry, readFileTree } from "./fs";
export type { HashInputs } from "./hash";
export { computeContentHash, hashConfig, stableStringify } from "./hash";
export type {
	MacroCollection,
	MacroTransformContext,
	MacroTransformResult,
} from "./macro";
export {
	collectMacroOptions,
	findMacroModules,
	MACRO_SOURCE,
	macroCollectionDir,
	macroCollectionName,
	transformMacroModule,
} from "./macro";
export type { PageMetaRecord } from "./pages";
export { PagePipeline } from "./pages";
export { relativeInside, samePath } from "./paths";
export type { ScannedPage } from "./scan";
export { scanCollection, scanPages } from "./scan";
export type { InvalidationResult, ServiceEntry } from "./service";
export { CompileService } from "./service";
export type { SyncOptions } from "./sync";
export { syncTypes } from "./sync";
export { collectionTypeData } from "./type-data";
