import type { FrontmatterData } from '@docvia/ir';
import { docviaError } from '@docvia/ir';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod/v3';

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
        throw new docviaError(
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
        throw new docviaError(
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
    extensionSchema?: z.ZodObject<z.ZodRawShape>,
): FrontmatterData {
    const schema = extensionSchema ? DocPageSchema.merge(extensionSchema) : DocPageSchema;
    const result = schema.safeParse(raw);

    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new docviaError(
            'SCHEMA_ERROR',
            `Frontmatter validation failed:\n${issues}`,
            filePath,
            { line: 1, column: 1 },
        );
    }

    return result.data as FrontmatterData;
}

// Zod → TypeScript type string conversion

function zodFieldToTs(schema: z.ZodTypeAny): { type: string; optional: boolean } {
    if (schema instanceof z.ZodOptional) {
        const inner = zodFieldToTs(schema.unwrap() as z.ZodTypeAny);
        return { type: inner.type, optional: true };
    }
    if (schema instanceof z.ZodDefault) {
        const inner = zodFieldToTs(schema.removeDefault() as z.ZodTypeAny);
        return { type: inner.type, optional: false };
    }
    if (schema instanceof z.ZodNullable) {
        const inner = zodFieldToTs(schema.unwrap() as z.ZodTypeAny);
        return { type: `${inner.type} | null`, optional: inner.optional };
    }
    if (schema instanceof z.ZodString) return { type: 'string', optional: false };
    if (schema instanceof z.ZodNumber) return { type: 'number', optional: false };
    if (schema instanceof z.ZodBoolean) return { type: 'boolean', optional: false };
    if (schema instanceof z.ZodLiteral) {
        // Zod v4 stores values as array; v3 stored as single .value
        const def = schema._def as { value?: unknown; values?: unknown[] };
        const val = def.values?.[0] ?? def.value ?? null;
        return { type: JSON.stringify(val), optional: false };
    }
    if (schema instanceof z.ZodEnum) {
        const opts = schema.options as string[];
        return { type: opts.map((v) => JSON.stringify(v)).join(' | '), optional: false };
    }
    if (schema instanceof z.ZodArray) {
        const inner = zodFieldToTs(schema.element as z.ZodTypeAny);
        return { type: `Array<${inner.type}>`, optional: false };
    }
    if (schema instanceof z.ZodUnion) {
        const types = (schema.options as z.ZodTypeAny[]).map((o) => zodFieldToTs(o as z.ZodTypeAny).type);
        return { type: types.join(' | '), optional: false };
    }
    return { type: 'unknown', optional: false };
}

/**
 * Converts a Zod object schema (merged with the base DocPageSchema) into a
 * TypeScript interface string suitable for emitting into `types.d.ts`.
 */
export function zodSchemaToFrontmatterTs(extensionSchema: z.ZodObject<z.ZodRawShape>): string {
    const merged = DocPageSchema.merge(extensionSchema);
    const lines: string[] = [];
    for (const [key, fieldSchema] of Object.entries(merged.shape)) {
        const { type, optional } = zodFieldToTs(fieldSchema as z.ZodTypeAny);
        lines.push(`  ${key}${optional ? '?' : ''}: ${type};`);
    }
    lines.push('  [key: string]: unknown;');
    return `{\n${lines.join('\n')}\n}`;
}
