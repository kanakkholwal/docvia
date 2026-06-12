// biome-ignore-all lint/suspicious/noExplicitAny: Vite plugin context is intentionally untyped passthrough.
import { relative, resolve } from "node:path";
import type { docviaConfig } from "@docvia/ir";
import { compileMarkdownToModule } from "@docvia/runtime";

export function docviaMarkdownPlugin(config: docviaConfig) {
	if (!config.renderer) {
		throw new Error("[docvia] No renderer configured");
	}

	const sourceDir = resolve(config.sourceDir ?? "docs");

	return {
		name: "docvia:markdown",

		async transform(code: string, id: string) {
			if (!id.endsWith(".md?docvia")) return null;

			const filePath = id.slice(0, -"?docvia".length);
			// Derive a source-relative path so `computeSlug` produces the same slug
			// as the Next.js loader (which passes `relative(sourceDir, filePath)`).
			// Passing the absolute `filePath` here would bake the absolute path
			// into the slug.
			const relativePath = relative(sourceDir, filePath).replace(/\\/g, "/");
			// Single source of truth for the markdown→module transform — the same
			// core helper the Next.js loader uses, so output stays identical.
			const { code: output, map } = await compileMarkdownToModule({
				code,
				filePath,
				relativePath,
				config,
			});
			return { code: output, map: (map as any) ?? null };
		},
	};
}
