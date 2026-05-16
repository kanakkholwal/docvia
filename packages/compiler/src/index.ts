// @docvia/compiler — batch build orchestrator.
//
// `compile()` is now a thin wrapper over the stateful CompileService in
// @docvia/runtime: instantiate, compile every file, flush the disk module
// graph. Dev-server plugins and SSR adapters drive the same service directly,
// so build, dev, and request-time output share one pipeline.

import type { CompileResult, CompilerOptions } from "@docvia/ir";
import { CompileService } from "@docvia/runtime";

export async function compile(
	options: CompilerOptions,
): Promise<CompileResult> {
	const service = new CompileService(options);
	const result = await service.compileAll();
	await service.emitDiskModuleGraph();
	return result;
}

export type { HashInputs } from "@docvia/runtime";
// Re-exported for backwards compatibility — these now live in @docvia/runtime.
export {
	computeContentHash,
	computeContentHash as hashContent,
} from "@docvia/runtime";
