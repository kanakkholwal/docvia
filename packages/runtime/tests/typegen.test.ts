import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syncTypes } from "../src/sync";

// Under tests/ so the fixture resolves @docvia/* from this package's node_modules.
let root: string;

const CONFIG = `import { defineConfig } from "@docvia/plugins";

const schema = <O>() => ({
	"~standard": {
		version: 1 as const,
		vendor: "test",
		validate: (value: unknown) => ({ value: value as O }),
		types: undefined as unknown as { input: Record<string, unknown>; output: O },
	},
});

export default defineConfig({
	collections: [
		{ name: "guides", sourceDir: "guides", frontmatter: schema<{ draft?: boolean }>() },
		{ name: "components", sourceDir: "components", frontmatter: schema<{ component: string }>() },
	],
	renderer: {
		name: "stub",
		renderPage: async () => ({ slug: "", code: "", contentHash: "" }),
		renderManifest: async () => "",
	},
});
`;

const CONSUMER = `import { components, guides } from "virtual:docvia/source";
import { registry } from "virtual:docvia/registry";

export const drafts: boolean[] = guides.getPages().map((p) => p.data.draft ?? false);
export const name: string = components.getPages()[0]!.data.component;
export const title: string = guides.getPages()[0]!.data.title;
// @ts-expect-error guides have no typed \`component\`
export const wrong: string = guides.getPages()[0]!.data.component;
registry.resolve("button");
`;

function diagnostics(files: string[]): string[] {
	const program = ts.createProgram(files, {
		strict: true,
		noImplicitAny: true,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		types: [],
	});
	return ts
		.getPreEmitDiagnostics(program)
		.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

beforeAll(async () => {
	root = await mkdtemp(join(import.meta.dirname, "tmp-"));
	await mkdir(join(root, "guides"), { recursive: true });
	await mkdir(join(root, "components"), { recursive: true });
	await writeFile(
		join(root, "guides", "start.md"),
		"---\ntitle: Start\ndraft: true\n---\n",
	);
	await writeFile(
		join(root, "components", "button.md"),
		"---\ntitle: Button\ncomponent: Button\n---\n",
	);
	await writeFile(join(root, "docvia.config.ts"), CONFIG);
	await writeFile(join(root, "consumer.ts"), CONSUMER);
});
afterAll(() => rm(root, { recursive: true, force: true }));

describe("syncTypes", () => {
	it("types every module without a bundler, per collection", async () => {
		const { pages } = await syncTypes({ cwd: root });
		expect(pages).toBe(2);
		const errors = diagnostics([
			join(root, "consumer.ts"),
			join(root, ".docvia", "env.d.ts"),
		]);
		expect(errors).toEqual([]);
	});

	it("fails loudly, not as `any`, when .docvia is missing", async () => {
		await rm(join(root, ".docvia"), { recursive: true, force: true });
		const errors = diagnostics([join(root, "consumer.ts")]);
		expect(errors.some((e) => e.includes("virtual:docvia/source"))).toBe(true);
	});
});
