import { directiveFromMarkdown } from 'mdast-util-directive';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { directive } from 'micromark-extension-directive';
import { gfm } from 'micromark-extension-gfm';
import { unified } from 'unified';
export async function parseMarkdown(content, options) {
    let ast = fromMarkdown(content, {
        extensions: [gfm(), directive()],
        mdastExtensions: [gfmFromMarkdown(), directiveFromMarkdown()],
    });
    if (options?.remarkPlugins?.length) {
        let processor = unified();
        for (const plugin of options.remarkPlugins) {
            processor = processor.use(plugin);
        }
        ast = (await processor.run(ast));
    }
    return { ast };
}
