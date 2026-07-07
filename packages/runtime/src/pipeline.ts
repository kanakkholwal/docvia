// The single markdown → IR pipeline. Both the stateful build/dev service
// (`CompileService.runPipeline`) and the stateless in-place loaders
// (`compileMarkdownToModule`, called by the Vite/webpack/Turbopack shims) drive
// documents through here, so every mode applies the exact same plugin phases,
// frontmatter validation, and AST → IR transform. Keeping this in one place is
// the point: change a pipeline step once and no mode can silently diverge.

import { parseMarkdown } from "@docvia/core";
import type {
	docviaConfig,
	FileEntry,
	FrontmatterData,
	IRDocument,
} from "@docvia/ir";
import { transformToIR } from "@docvia/ir";
import type { PluginRunner } from "@docvia/plugins";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import type { Root as HastRoot } from "hast";

export interface MarkdownToIROptions {
	/** The source file. `hash` may be empty for one-shot loader compiles. */
	readonly file: FileEntry;
	readonly config: docviaConfig;
	/** Plugin runner to drive the hook phases. */
	readonly runner: PluginRunner;
	/**
	 * Compute the stable content hash from the validated frontmatter. When
	 * provided, the result is injected into the IR *before* the post-transform
	 * plugin phases (matching the build service's cache semantics). Omit it and
	 * the IR keeps the hash produced by `transformToIR` — loaders that don't
	 * consult a cache have no reason to compute one.
	 */
	readonly contentHash?: (frontmatter: FrontmatterData) => string;
}

export interface MarkdownToIRResult {
	readonly ir: IRDocument;
	readonly frontmatter: FrontmatterData;
}

/**
 * Run one markdown document through the full pipeline: `beforeParse` →
 * frontmatter extraction + validation → markdown parse → `afterParse` →
 * `beforeTransform` → AST → IR transform → (optional content hash) →
 * `afterTransform` → `beforeRender`. Returns the finished IR and the validated
 * frontmatter; rendering (or PageMeta/route derivation) is the caller's job.
 */
export async function markdownToIR(
	opts: MarkdownToIROptions,
): Promise<MarkdownToIRResult> {
	const { file, config, runner } = opts;

	const processedFile = await runner.runBeforeParse(file);
	const extracted = extractFrontmatter(processedFile.content);
	const frontmatter = validateFrontmatter(
		extracted.data,
		file.path,
		config.frontmatter,
	);

	const { ast } = await parseMarkdown(extracted.content, {
		remarkPlugins: config.markdown.remarkPlugins,
	});

	const processedAst = (await runner.runAfterParse(
		ast,
		processedFile,
	)) as HastRoot;
	const finalAst = (await runner.runBeforeTransform(
		processedAst,
		frontmatter,
	)) as HastRoot;

	let ir = transformToIR(finalAst, frontmatter, file.relativePath);
	if (opts.contentHash) {
		ir = { ...ir, contentHash: opts.contentHash(frontmatter) };
	}
	ir = await runner.runAfterTransform(ir);
	ir = await runner.runBeforeRender(ir);

	return { ir, frontmatter };
}
