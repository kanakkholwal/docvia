import { describe, expect, it } from 'vitest';
import { computeContentHash } from '../src/index';

describe('computeContentHash', () => {
	it('generates consistent hash for same inputs', () => {
		const inputs = {
			fileContent: 'const x = 1;',
			frontmatter: 'title: Test',
			configHash: 'config123',
			pluginCacheKeys: ['key1', 'key2'],
			dependencyHashes: ['dep1', 'dep2'],
		};

		const hash1 = computeContentHash(inputs);
		const hash2 = computeContentHash(inputs);

		expect(hash1).toBe(hash2);
	});

	it('generates different hashes for different file content', () => {
		const baseInputs = {
			frontmatter: 'title: Test',
			configHash: 'config123',
			pluginCacheKeys: [],
			dependencyHashes: [],
		};

		const hash1 = computeContentHash({
			...baseInputs,
			fileContent: 'content1',
		});

		const hash2 = computeContentHash({
			...baseInputs,
			fileContent: 'content2',
		});

		expect(hash1).not.toBe(hash2);
	});

	it('generates different hashes for different frontmatter', () => {
		const baseInputs = {
			fileContent: 'const x = 1;',
			configHash: 'config123',
			pluginCacheKeys: [],
			dependencyHashes: [],
		};

		const hash1 = computeContentHash({
			...baseInputs,
			frontmatter: 'title: Test1',
		});

		const hash2 = computeContentHash({
			...baseInputs,
			frontmatter: 'title: Test2',
		});

		expect(hash1).not.toBe(hash2);
	});

	it('generates different hashes for different config hash', () => {
		const baseInputs = {
			fileContent: 'const x = 1;',
			frontmatter: 'title: Test',
			pluginCacheKeys: [],
			dependencyHashes: [],
		};

		const hash1 = computeContentHash({
			...baseInputs,
			configHash: 'config1',
		});

		const hash2 = computeContentHash({
			...baseInputs,
			configHash: 'config2',
		});

		expect(hash1).not.toBe(hash2);
	});

	it('generates different hashes for different plugin cache keys', () => {
		const baseInputs = {
			fileContent: 'const x = 1;',
			frontmatter: 'title: Test',
			configHash: 'config123',
			dependencyHashes: [],
		};

		const hash1 = computeContentHash({
			...baseInputs,
			pluginCacheKeys: ['key1'],
		});

		const hash2 = computeContentHash({
			...baseInputs,
			pluginCacheKeys: ['key2'],
		});

		expect(hash1).not.toBe(hash2);
	});

	it('handles empty arrays', () => {
		const inputs = {
			fileContent: 'content',
			frontmatter: 'frontmatter',
			configHash: 'config',
			pluginCacheKeys: [],
			dependencyHashes: [],
		};

		const hash = computeContentHash(inputs);
		expect(hash).toBeTruthy();
		expect(typeof hash).toBe('string');
	});

	it('order of plugin keys matters', () => {
		const baseInputs = {
			fileContent: 'const x = 1;',
			frontmatter: 'title: Test',
			configHash: 'config123',
			dependencyHashes: [],
		};

		const hash1 = computeContentHash({
			...baseInputs,
			pluginCacheKeys: ['key1', 'key2'],
		});

		const hash2 = computeContentHash({
			...baseInputs,
			pluginCacheKeys: ['key2', 'key1'],
		});

		expect(hash1).not.toBe(hash2);
	});

	it('returns base36 encoded hash', () => {
		const inputs = {
			fileContent: 'test',
			frontmatter: 'fm',
			configHash: 'cfg',
			pluginCacheKeys: [],
			dependencyHashes: [],
		};

		const hash = computeContentHash(inputs);
		expect(/^[0-9a-z]+$/.test(hash)).toBe(true);
	});
});
