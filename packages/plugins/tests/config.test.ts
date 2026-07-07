import { docviaError } from "@docvia/ir";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	CONFIG_BASENAMES,
	resolveConfigPath,
	resolveProject,
} from "../src/index";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "docvia-config-"));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("resolveConfigPath", () => {
	it("returns an explicit path resolved against cwd, even if missing", () => {
		const p = resolveConfigPath(dir, "custom.config.ts");
		expect(p).toBe(resolve(dir, "custom.config.ts"));
	});

	it("returns undefined when explicit is false (opt-out)", () => {
		expect(resolveConfigPath(dir, false)).toBeUndefined();
	});

	it("returns undefined when no conventional config exists", () => {
		expect(resolveConfigPath(dir)).toBeUndefined();
	});

	it("auto-detects a conventional config file", () => {
		writeFileSync(join(dir, "docvia.config.ts"), "export default {}");
		expect(resolveConfigPath(dir)).toBe(resolve(dir, "docvia.config.ts"));
	});

	it("prefers earlier basenames in CONFIG_BASENAMES order", () => {
		// Write two candidates; the .ts one (earlier in the list) must win.
		writeFileSync(join(dir, "docvia.config.mjs"), "export default {}");
		writeFileSync(join(dir, "docvia.config.ts"), "export default {}");
		expect(CONFIG_BASENAMES.indexOf("docvia.config.ts")).toBeLessThan(
			CONFIG_BASENAMES.indexOf("docvia.config.mjs"),
		);
		expect(resolveConfigPath(dir)).toBe(resolve(dir, "docvia.config.ts"));
	});

	it("detects non-.ts extensions when they are the only config", () => {
		writeFileSync(join(dir, "docvia.config.mjs"), "export default {}");
		expect(resolveConfigPath(dir)).toBe(resolve(dir, "docvia.config.mjs"));
	});
});

describe("resolveProject", () => {
	it("falls back to defaults rooted at cwd when no config exists", async () => {
		const { config, configPath, projectRoot } = await resolveProject({
			cwd: dir,
		});
		expect(configPath).toBeUndefined();
		expect(projectRoot).toBe(resolve(dir));
		// defineConfig defaults
		expect(config.sourceDir).toBe("docs");
		expect(config.outDir).toBe(".docvia");
	});

	it("throws CONFIG_ERROR when required and no config exists", async () => {
		await expect(
			resolveProject({ cwd: dir, required: true }),
		).rejects.toBeInstanceOf(docviaError);
	});

	it("loads a discovered config and roots the project at its directory", async () => {
		writeFileSync(
			join(dir, "docvia.config.ts"),
			'export default { sourceDir: "custom-docs" };',
		);
		const { config, configPath, projectRoot } = await resolveProject({
			cwd: dir,
		});
		expect(configPath).toBe(resolve(dir, "docvia.config.ts"));
		expect(projectRoot).toBe(resolve(dir));
		expect(config.sourceDir).toBe("custom-docs");
		// Untouched fields still get defaults from defineConfig.
		expect(config.outDir).toBe(".docvia");
	});

	it("throws when an explicit config path is given but missing", async () => {
		await expect(
			resolveProject({ cwd: dir, configPath: "nope.config.ts", required: true }),
		).rejects.toBeInstanceOf(docviaError);
	});
});
