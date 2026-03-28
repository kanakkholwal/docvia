import type { Root as MdastRoot } from 'mdast';
import { directiveFromMarkdown } from 'mdast-util-directive';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { directive } from 'micromark-extension-directive';
import { gfm } from 'micromark-extension-gfm';
import { unified } from 'unified';

export interface ParseOptions {
    // biome-ignore lint/suspicious/noExplicitAny: remark plugins are untyped
    readonly remarkPlugins?: readonly any[];
}

export interface ParseResult {
    readonly ast: MdastRoot;
}

export async function parseMarkdown(
    content: string,
    options?: ParseOptions,
): Promise<ParseResult> {
    let ast: MdastRoot = fromMarkdown(content, {
        extensions: [gfm(), directive()],
        mdastExtensions: [gfmFromMarkdown(), directiveFromMarkdown()],
    });

    if (options?.remarkPlugins?.length) {
        let processor = unified();
        for (const plugin of options.remarkPlugins) {
            processor = processor.use(plugin);
        }
        ast = (await processor.run(ast)) as MdastRoot;
    }

    return { ast };
}
