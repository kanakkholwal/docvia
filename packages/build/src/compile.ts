import type { CompileResult, CompilerOptions } from "@docvia/core";
import { CompileService } from "./service";

/** Compiles every page once and writes the module graph; dev servers drive `CompileService` directly. */
export async function compile(
	options: CompilerOptions,
): Promise<CompileResult> {
	const service = new CompileService(options);
	const result = await service.compileAll();
	await service.emitDiskModuleGraph();
	return result;
}
