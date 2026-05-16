import { describe, expect, it } from "vitest";
import { withDocvia } from "../src/index";

// These tests run with no docvia.config.ts present, so `withDocvia` skips
// compilation and exercises just the Next config-wrapper logic.

describe("withDocvia", () => {
	it("wraps a Next config with webpack and turbopack docvia aliases", async () => {
		const configFn = withDocvia()({});
		const result = await configFn("phase-development-server", {});

		expect(typeof result.webpack).toBe("function");
		expect(result.turbopack).toBeDefined();
		expect(result.turbopack.resolveAlias["docvia/source"]).toBeTruthy();
		expect(result.turbopack.resolveAlias["docvia/registry"]).toBeTruthy();
	});

	it("webpack hook registers the docvia/source alias", async () => {
		const configFn = withDocvia()({});
		const result = await configFn("phase-development-server", {});

		const webpackConfig: { resolve?: { alias?: Record<string, string> } } = {};
		const out = result.webpack(webpackConfig, {});

		expect(out.resolve.alias["docvia/source"]).toMatch(/source\.ts$/);
		expect(out.resolve.alias["docvia/registry"]).toMatch(/registry\.ts$/);
	});

	it("preserves the caller's existing Next config", async () => {
		const configFn = withDocvia()({ reactStrictMode: true });
		const result = await configFn("phase-development-server", {});

		expect(result.reactStrictMode).toBe(true);
	});
});
