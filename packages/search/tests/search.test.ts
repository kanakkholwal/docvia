import { describe, expect, it } from 'vitest';

describe('search module', () => {
	it('exports search API functions', async () => {
		const module = await import('../src/index');

		expect(module.extractTextFromIR).toBeDefined();
		expect(module.extractSections).toBeDefined();
		expect(typeof module.extractTextFromIR).toBe('function');
		expect(typeof module.extractSections).toBe('function');
	});

	it('should be able to import search utilities', async () => {
		const { extractTextFromIR, extractSections } = await import('../src/index');

		expect(extractTextFromIR).toBeTruthy();
		expect(extractSections).toBeTruthy();
	});

	it('handles malformed IR gracefully', async () => {
		const { extractTextFromIR } = await import('../src/index');

		// Should not throw on edge cases
		const result1 = extractTextFromIR([]);
		expect(typeof result1).toBe('string');

		const result2 = extractTextFromIR([
			{
				type: 'unknown',
				id: 'test',
				props: {},
				children: [],
			},
		]);
		expect(typeof result2).toBe('string');
	});

	it('search module is properly typed', async () => {
		const module = await import('../src/index');

		// Verify that the module exports are correctly typed
		expect(module).toHaveProperty('extractTextFromIR');
		expect(module).toHaveProperty('extractSections');
	});
});
