import type { FrontmatterData } from '@dockit/ir';
import { DockitError } from '@dockit/ir';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

// Frontmatter Extraction

export interface ExtractedFrontmatter {
    readonly data: Record<string, unknown>;
    readonly content: string;
    readonly bodyOffset: number;
}

export function extractFrontmatter(raw: string): ExtractedFrontmatter {
    const lines = raw.split(/\r?\n/);

    if (lines[0]?.trim() !== '---') {
        return { data: {}, content: raw, bodyOffset: 1 };
    }

    let closingIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim() === '---') {
            closingIndex = i;
            break;
        }
    }

    if (closingIndex === -1) {
        throw new DockitError(
            'SCHEMA_ERROR',
            'Unclosed frontmatter: missing closing ---',
            undefined,
            { line: 1, column: 1 },
        );
    }

    const yamlLines = lines.slice(1, closingIndex);
    const bodyOffset = closingIndex + 2;
    const content = lines.slice(closingIndex + 1).join('\n');

    if (yamlLines.length === 0 || yamlLines.every((l) => l.trim() === '')) {
        return { data: {}, content, bodyOffset };
    }

    let data: Record<string, unknown>;
    try {
        data = parseYaml(yamlLines.join('\n')) as Record<string, unknown>;
    } catch (err) {
        throw new DockitError(
            'SCHEMA_ERROR',
            `Invalid YAML in frontmatter: ${(err as Error).message}`,
            undefined,
            { line: 2, column: 1 },
            err as Error,
        );
    }

    if (typeof data !== 'object' || data === null) {
        return { data: {}, content, bodyOffset };
    }

    return { data, content, bodyOffset };
}

// Zod Schema

export const DocPageSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().default(''),
    slug: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    order: z.number().optional(),
}).passthrough();

export function validateFrontmatter(
    raw: Record<string, unknown>,
    filePath?: string,
): FrontmatterData {
    const result = DocPageSchema.safeParse(raw);

    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new DockitError(
            'SCHEMA_ERROR',
            `Frontmatter validation failed:\n${issues}`,
            filePath,
            { line: 1, column: 1 },
        );
    }

    return result.data as FrontmatterData;
}
