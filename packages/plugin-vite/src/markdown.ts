// biome-ignore-all lint/suspicious/noExplicitAny: Vite plugin context is intentionally untyped passthrough.
import type { docviaConfig } from "@docvia/ir";
import { compileMarkdownToModule } from "@docvia/runtime";

export function docviaMarkdownPlugin(config: docviaConfig) {
	if (!config.renderer) {
		throw new Error("[docvia] No renderer configured");
	}

	return {
		name: "docvia:markdown",

		async transform(code: string, id: string) {
			if (!id.endsWith(".md?docvia")) return null;

			const filePath = id.slice(0, -"?docvia".length);
			// Single source of truth for the markdown→module transform — the same
			// core helper the Next.js loader uses, so output stays identical.
			const { code: output, map } = await compileMarkdownToModule({
				code,
				filePath,
				relativePath: filePath,
				config,
			});
			return { code: output, map: (map as any) ?? null };
		},
	};
}
