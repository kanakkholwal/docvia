import { describe, expect, it } from 'vitest';
import { docviaError } from '../src/index';

describe('docviaError', () => {
	it('creates error with required fields', () => {
		const error = new docviaError('PARSE_ERROR', 'Unexpected content');

		expect(error.name).toBe('docviaError');
		expect(error.code).toBe('PARSE_ERROR');
		expect(error.message).toBe('Unexpected content');
		expect(error.file).toBeUndefined();
		expect(error.loc).toBeUndefined();
		expect(error.cause).toBeUndefined();
	});

	it('includes file path when provided', () => {
		const error = new docviaError('SCHEMA_ERROR', 'Invalid schema', '/docs/test.md');

		expect(error.code).toBe('SCHEMA_ERROR');
		expect(error.file).toBe('/docs/test.md');
	});

	it('includes location information when provided', () => {
		const loc = { line: 5, column: 12 };
		const error = new docviaError('TRANSFORM_ERROR', 'Transform failed', undefined, loc);

		expect(error.loc).toEqual(loc);
		expect(error.loc?.line).toBe(5);
		expect(error.loc?.column).toBe(12);
	});

	it('includes cause error when provided', () => {
		const cause = new Error('Original error');
		const error = new docviaError('RENDER_ERROR', 'Rendering failed', undefined, undefined, cause);

		expect(error.cause).toBe(cause);
		expect((error.cause as Error).message).toBe('Original error');
	});

	it('supports all error codes', () => {
		const codes: Array<'SCHEMA_ERROR' | 'PARSE_ERROR' | 'TRANSFORM_ERROR' | 'RENDER_ERROR' | 'PLUGIN_ERROR' | 'CONFIG_ERROR' | 'ASSET_ERROR'> = [
			'SCHEMA_ERROR',
			'PARSE_ERROR',
			'TRANSFORM_ERROR',
			'RENDER_ERROR',
			'PLUGIN_ERROR',
			'CONFIG_ERROR',
			'ASSET_ERROR',
		];

		for (const code of codes) {
			const error = new docviaError(code, `Test ${code}`);
			expect(error.code).toBe(code);
		}
	});

	it('includes all context information together', () => {
		const cause = new Error('Underlying issue');
		const loc = { line: 10, column: 5 };
		const error = new docviaError(
			'PLUGIN_ERROR',
			'Plugin initialization failed',
			'/docs/advanced.md',
			loc,
			cause,
		);

		expect(error.code).toBe('PLUGIN_ERROR');
		expect(error.message).toBe('Plugin initialization failed');
		expect(error.file).toBe('/docs/advanced.md');
		expect(error.loc).toEqual(loc);
		expect(error.cause).toBe(cause);
	});

	it('extends Error class properly', () => {
		const error = new docviaError('CONFIG_ERROR', 'Config is missing');

		expect(error instanceof Error).toBe(true);
		expect(error instanceof docviaError).toBe(true);
	});
});
