import assert from 'node:assert';
import { parseMarkdown } from './packages/core/dist/index.js';
import { transformToIR } from './packages/ir/dist/transform.js';
import { createDefaultRendererMap, renderDocument } from './packages/renderer-core/dist/index.js';

async function run() {
    const markdown = `
| A | B |
|---|---|
| 1 | 2 |
`;

    const { ast } = await parseMarkdown(markdown);
    const ir = transformToIR(ast, { title: 'Test', description: 'Desc', tags: [] }, 'test.md');

    // 1. Verify IR structure for Table
    const table = ir.children.find(n => n.type === 'table');
    assert.ok(table, 'Should have a table');

    // Check for thead and tbody as element nodes
    const thead = table.children.find(n => n.type === 'element' && n.props.tag === 'thead');
    const tbody = table.children.find(n => n.type === 'element' && n.props.tag === 'tbody');

    assert.ok(thead, 'Should have thead as an element');
    assert.ok(tbody, 'Should have tbody as an element');
    assert.ok(thead.type !== 'unknown', 'thead should NOT be unknown');

    // 2. Verify Render Output
    const rendererMap = createDefaultRendererMap();
    const ctx = {
        slug: 'test',
        meta: {},
        registry: { resolve: () => null },
        highlighter: { highlight: async (c) => ({ html: c }) }
    };

    const { output } = await renderDocument(ir, rendererMap, ctx);

    // Find the table in the output
    const renderedTable = output.children.find(n => n.kind === 'element' && n.tag === 'table');
    assert.ok(renderedTable, 'Should render as <table>');

    const renderedThead = renderedTable.children.find(n => n.kind === 'element' && n.tag === 'thead');
    assert.ok(renderedThead, 'Should render as <thead>');
    assert.strictEqual(renderedThead.kind, 'element');

    console.log('✅ Table rendering smoke test passed!');
}

run().catch(e => {
    console.error('❌ Table rendering smoke test failed:');
    console.error(e);
    process.exit(1);
});
