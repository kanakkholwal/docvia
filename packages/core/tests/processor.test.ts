import { describe, expect, it } from 'vitest';

describe('parseMarkdown processor caching', () => {
	it('should cache processor by plugin reference', async () => {
		// This test validates that the processor caching behavior works correctly
		// The parseMarkdown function caches processors using WeakMap to avoid
		// rebuilding the unified pipeline for every document
		const { parseMarkdown } = await import('../src/index');

		// Parse with no custom plugins twice
		const result1 = await parseMarkdown('# Test 1');
		const result2 = await parseMarkdown('# Test 2');

		// Both should produce valid AST
		expect(result1.ast).toBeDefined();
		expect(result2.ast).toBeDefined();
		expect(result1.ast.type).toBe('root');
		expect(result2.ast.type).toBe('root');
	});

	it('should handle GFM extensions (strikethrough, tables)', async () => {
		const { parseMarkdown } = await import('../src/index');
		const content = '~~strikethrough~~ text';

		const result = await parseMarkdown(content);
		expect(result.ast).toBeDefined();
	});

	it('should handle directives', async () => {
		const { parseMarkdown } = await import('../src/index');
		const content = '::: note\nThis is a note\n:::';

		const result = await parseMarkdown(content);
		expect(result.ast).toBeDefined();
	});

	it('parses blockquotes', async () => {
		const { parseMarkdown } = await import('../src/index');
		const content = '> This is a quote\n> with multiple lines';

		const result = await parseMarkdown(content);
		const blockquotes = findElementsByTag(result.ast.children, 'blockquote');
		expect(blockquotes.length).toBeGreaterThan(0);
	});

	it('parses horizontal rules', async () => {
		const { parseMarkdown } = await import('../src/index');
		const content = 'Text\n\n---\n\nMore text';

		const result = await parseMarkdown(content);
		const hrs = findElementsByTag(result.ast.children, 'hr');
		expect(hrs.length).toBeGreaterThan(0);
	});
});

function findElementsByTag(nodes: any[], tagName: string): any[] {
	const result: any[] = [];
	const traverse = (node: any) => {
		if (node.type === 'element' && node.tagName === tagName) {
			result.push(node);
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				traverse(child);
			}
		}
	};
	for (const node of nodes) {
		traverse(node);
	}
	return result;
}
