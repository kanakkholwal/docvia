/** Landing-page code samples. Highlighted at build time by vite-plugin-snippets. */
export type Snippet = { lang: string; code: string };

export const snippets = {
	"config.ts": {
		lang: "typescript",
		code: `import { defineConfig } from "@docvia/cli";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [
    shiki({ theme: "github-dark", langs: ["typescript", "bash", "json"] }),
  ],
});`,
	},
	"schema.ts": {
		lang: "typescript",
		code: `import { defineConfig } from "@docvia/cli";
import { z } from "zod";

export default defineConfig({
  // Frontmatter is validated at compile time, and the matching
  // TypeScript interface is generated for every collection.
  frontmatter: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date().optional(),
  }),
});`,
	},
	"page.tsx": {
		lang: "tsx",
		code: `import { DocviaContent } from "@docvia/renderer-react";
import { docs } from "docvia/source";

export default async function DocPage({ params }) {
  const page = await docs.getPage(params.slug);
  if (!page) return null;

  // No parser, no highlighter, just a compiled module.
  return <DocviaContent nodes={page.content} />;
}`,
	},
	"page.svelte": {
		lang: "svelte",
		code: `<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<!-- Same compiled IR the React adapter renders. -->
<article>
  <Renderer nodes={data.page.content} />
</article>`,
	},
	frontmatter: {
		lang: "typescript",
		code: `type Frontmatter = {
  title: string;
  tags: string[];
  publishedAt: Date;
};`,
	},
} as const satisfies Record<string, Snippet>;

export type SnippetName = keyof typeof snippets;
