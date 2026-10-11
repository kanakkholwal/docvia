import type { Root as HastRoot } from "hast";
import type {
	docviaConfig,
	FileEntry,
	FrontmatterData,
	FrontmatterSchema,
	IRDocument,
} from "../ir/index";
import { transformToIR } from "../ir/index";
import type { PluginRunner } from "../plugins/runner";
import { extractFrontmatter, validateFrontmatter } from "../schema/index";
import { parseMarkdown } from "./parse";

export interface MarkdownToIROptions {
	/** The source file. `hash` may be empty for one-shot compiles. */
	readonly file: FileEntry;
	readonly config: docviaConfig;
	/** Overrides `config.frontmatter`, e.g. with a collection's own schema. */
	readonly frontmatterSchema?: FrontmatterSchema;
	/** Plugin runner to drive the hook phases. */
	readonly runner: PluginRunner;
	/** Content hash from the validated frontmatter, set before the post-transform hooks run. */
	readonly contentHash?: (frontmatter: FrontmatterData) => string;
}

export interface MarkdownToIRResult {
	readonly ir: IRDocument;
	readonly frontmatter: FrontmatterData;
}

/**
 * The one Markdown -> IR pipeline every mode shares: every plugin hook, frontmatter validation and
 * the AST -> IR transform. Rendering is the caller's job.
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
		opts.frontmatterSchema ?? config.frontmatter,
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
