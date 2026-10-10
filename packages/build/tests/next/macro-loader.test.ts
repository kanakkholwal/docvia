import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withDocvia } from "../../src/next/index";
import macroLoader from "../../src/next/macro-loader";

const SOURCE = `import { defineDocs } from "@docvia/core/source/macro";
import { loader } from "@docvia/core/source";

const docs = defineDocs({ dir: "content/docs" });
export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
`;

let base: string;
const docsDir = () => join(base, "content", "docs");

beforeAll(async () => {
	base = await mkdtemp(join(import.meta.dirname, "tmp-"));
	await mkdir(join(docsDir(), "guide"), { recursive: true });
	await mkdir(join(base, "lib"), { recursive: true });
	await writeFile(join(base, "docvia.config.ts"), "export default {};\n");
	await writeFile(
		join(docsDir(), "index.md"),
		"---\ntitle: Home\n---\n\nHi.\n",
	);
	await writeFile(
		join(docsDir(), "guide", "install.md"),
		"---\ntitle: Install\n---\n\nSteps.\n",
	);
	await writeFile(
		join(docsDir(), "guide", "meta.json"),
		JSON.stringify({ pages: ["install"] }),
	);
	await writeFile(join(base, "lib", "source.ts"), SOURCE);
});

afterAll(() => rm(base, { recursive: true, force: true }));

function runLoader(source: string, resourcePath: string) {
	const deps: string[] = [];
	const contextDeps: string[] = [];
	return new Promise<{ code: string; deps: string[]; contextDeps: string[] }>(
		(done, fail) => {
			macroLoader.call(
				{
					resourcePath,
					getOptions: () => ({ root: base }),
					addDependency: (f: string) => deps.push(f),
					addContextDependency: (d: string) => contextDeps.push(d),
					async: () => (err: Error | null, code: string) =>
						err ? fail(err) : done({ code, deps, contextDeps }),
				},
				source,
			);
		},
	);
}

describe("macro loader", () => {
	it("rewrites defineDocs() into an inline index with lazy body imports", async () => {
		const { code, deps, contextDeps } = await runLoader(
			SOURCE,
			join(base, "lib", "source.ts"),
		);

		expect(code).toContain("@docvia/core/source/macro-runtime");
		expect(code).toContain('"title":"Install"');
		expect(code).toMatch(
			/"\.\/guide\/install\.md": \(\) => import\("[^"]*install\.md\?docvia&collection=macro%3Acontent%2Fdocs"\)/,
		);
		expect(code).toMatch(/import \w+ from "[^"]*guide\/meta\.json"/);
		expect(code).not.toContain("defineDocs(");
		expect(contextDeps).toEqual([docsDir()]);
		expect(deps).toEqual(
			expect.arrayContaining([join(base, "docvia.config.ts")]),
		);
		expect(deps).toHaveLength(3);
	});

	it("reloads the config after it changes", async () => {
		const config = join(base, "docvia.config.ts");
		const file = join(base, "lib", "source.ts");
		await runLoader(SOURCE, file);
		const touch = (s: number) => utimes(config, s, s);

		await writeFile(config, 'throw new Error("broken config");\n');
		await touch(Date.now() / 1000 + 10);
		await expect(runLoader(SOURCE, file)).rejects.toThrow("broken config");

		await writeFile(config, "export default {};\n");
		await touch(Date.now() / 1000 + 20);
		await expect(runLoader(SOURCE, file)).resolves.toBeDefined();
	});

	it("passes modules without the macro import through untouched", async () => {
		const plain = "export const x = 1;\n";
		const { code } = await runLoader(plain, join(base, "lib", "other.ts"));
		expect(code).toBe(plain);
	});
});

describe("withDocvia macro rules", () => {
	it("routes source and registry files through the macro loader", async () => {
		const result = await withDocvia()({})("phase-development-server", {});
		const rules = result.turbopack.rules;
		expect(rules["source.ts"].loaders[0].loader).toBe(
			"@docvia/build/next/macro-loader",
		);
		expect(rules["registry.ts"]).toBeDefined();

		const out = result.webpack({ module: { rules: [] } }, {});
		const macroRule = out.module.rules.find(
			(r: { enforce?: string }) => r.enforce === "pre",
		);
		expect(macroRule.test.test("/app/lib/source.ts")).toBe(true);
		expect(macroRule.test.test("/app/lib/my-source.ts")).toBe(false);
	});
});
