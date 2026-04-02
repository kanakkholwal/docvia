import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../src/index';

describe('parseMarkdown', () => {
	it('parses basic markdown', async () => {
		const content = '# Hello\n\nThis is a paragraph.';
		const result = await parseMarkdown(content);

		expect(result.ast).toBeDefined();
		expect(result.ast.type).toBe('root');
		expect(Array.isArray(result.ast.children)).toBe(true);
	});

	it('parses heading elements', async () => {
		const content = '# Heading 1\n## Heading 2\n### Heading 3';
		const result = await parseMarkdown(content);

		expect(result.ast.children.length).toBeGreaterThan(0);
		const headings = result.ast.children.filter(
			(node: any) => node.type === 'element' && /^h[1-6]$/.test(node.tagName),
		);
		expect(headings.length).toBeGreaterThanOrEqual(1);
	});

	it('parses paragraphs', async () => {
		const content = 'First paragraph.\n\nSecond paragraph.';
		const result = await parseMarkdown(content);

		const paragraphs = result.ast.children.filter(
			(node: any) => node.type === 'element' && node.tagName === 'p',
		);
		expect(paragraphs.length).toBeGreaterThanOrEqual(2);
	});

	it('parses lists', async () => {
		const content = '- Item 1\n- Item 2\n- Item 3';
		const result = await parseMarkdown(content);

		const lists = result.ast.children.filter(
			(node: any) => node.type === 'element' && (node.tagName === 'ul' || node.tagName === 'ol'),
		);
		expect(lists.length).toBeGreaterThan(0);
	});

	it('parses code blocks', async () => {
		const content = '```js\nconst x = 1;\n```';
		const result = await parseMarkdown(content);

		const codeBlocks = result.ast.children.filter(
			(node: any) => node.type === 'element' && node.tagName === 'pre',
		);
		expect(codeBlocks.length).toBeGreaterThan(0);
	});

	it('parses emphasis and strong', async () => {
		const content = 'This has *emphasis* and **strong** text.';
		const result = await parseMarkdown(content);

		expect(result.ast.children.length).toBeGreaterThan(0);
	});

	it('parses inline code', async () => {
		const content = 'Use `const x = 1;` in your code.';
		const result = await parseMarkdown(content);

		const paragraphs = result.ast.children.filter(
			(node: any) => node.type === 'element' && node.tagName === 'p',
		);
		expect(paragraphs.length).toBeGreaterThan(0);
	});

	it('parses links', async () => {
		const content = '[Google](https://google.com)';
		const result = await parseMarkdown(content);

		const links = findElementsByTag(result.ast.children, 'a');
		expect(links.length).toBeGreaterThan(0);
	});

	it('parses images', async () => {
		const content = '![Alt text](image.png)';
		const result = await parseMarkdown(content);

		const images = findElementsByTag(result.ast.children, 'img');
		expect(images.length).toBeGreaterThan(0);
	});

	it('parses tables (GFM)', async () => {
		const content = '| Head 1 | Head 2 |\n|--------|--------|\n| Cell 1 | Cell 2 |';
		const result = await parseMarkdown(content);

		const tables = findElementsByTag(result.ast.children, 'table');
		expect(tables.length).toBeGreaterThan(0);
	});

	it('sanitizes potentially dangerous content', async () => {
		const content = '<script>alert("xss")</script><p>Safe paragraph</p>';
		const result = await parseMarkdown(content);

		const scripts = findElementsByTag(result.ast.children, 'script');
		expect(scripts.length).toBe(0);
	});

	it('preserves safe HTML attributes', async () => {
		const content = '<a href="https://example.com" title="Example">Link</a>';
		const result = await parseMarkdown(content);

		const links = findElementsByTag(result.ast.children, 'a');
		expect(links.length).toBeGreaterThan(0);
	});

	it('handles empty content', async () => {
		const result = await parseMarkdown('');
		expect(result.ast).toBeDefined();
		expect(result.ast.type).toBe('root');
	});

	it('handles whitespace-only content', async () => {
		const result = await parseMarkdown('   \n\n   \n');
		expect(result.ast).toBeDefined();
		expect(result.ast.type).toBe('root');
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
