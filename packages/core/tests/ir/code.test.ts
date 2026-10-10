import { describe, expect, it } from "vitest";
import { convertNpmCommand, parseFenceMeta } from "../../src/ir/code";

describe("parseFenceMeta", () => {
	it("reads quoted, bare and flag attributes", () => {
		const meta = parseFenceMeta(
			`title="vite.config.ts" tab='React' lines=3 noCopy`,
		);
		expect(meta.title).toBe("vite.config.ts");
		expect(meta.tab).toBe("React");
		expect(meta.attributes).toMatchObject({ lines: "3", noCopy: true });
	});

	it("tolerates a missing meta string", () => {
		expect(parseFenceMeta(undefined)).toEqual({
			title: undefined,
			tab: undefined,
			attributes: {},
		});
	});
});

describe("convertNpmCommand", () => {
	it.each([
		["npm install @docvia/cli", "pnpm", "pnpm add @docvia/cli"],
		["npm i -D vite", "yarn", "yarn add -D vite"],
		["npm install", "bun", "bun install"],
		["npm i -g @docvia/cli", "yarn", "yarn global add @docvia/cli"],
		["npx docvia sync", "pnpm", "pnpm dlx docvia sync"],
		["npx docvia sync", "bun", "bunx docvia sync"],
		["npm run build", "yarn", "yarn build"],
		["npm run build", "pnpm", "pnpm run build"],
		["npm create docvia@latest", "bun", "bun create docvia@latest"],
		["echo done", "pnpm", "echo done"],
	] as const)("%s -> %s", (input, pm, expected) => {
		expect(convertNpmCommand(input, pm)).toBe(expected);
	});
});
