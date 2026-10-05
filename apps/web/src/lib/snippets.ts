/** Landing-page code samples. Highlighted at build time by vite-plugin-snippets. */
export type Snippet = { lang: string; code: string };

export const snippets = {
	"config.ts": {
		lang: "typescript",
		code: `import { defineConfig } from "@docvia/plugin-vite";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createReactRenderer(),
  plugins: [
    shiki({ theme: "github-dark", langs: ["typescript", "bash", "json"] }),
  ],
});`,
	},
	"source.ts": {
		lang: "typescript",
		code: `import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  // Validated at compile time; page.data is typed from it.
  docs: { schema: z.object({ publishedAt: z.coerce.date().optional() }) },
});

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });`,
	},
	"page.tsx": {
		lang: "tsx",
		code: `import { DocviaContent } from "@docvia/renderer-react";
import { notFound } from "next/navigation";
import { source } from "@/lib/source";

export default async function DocPage({ params }) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  // No parser, no highlighter, just a compiled module.
  const { content } = await page.data.load();
  return <DocviaContent nodes={content} />;
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
  <Renderer nodes={data.content} />
</article>`,
	},
	"search-worker.ts": {
		lang: "typescript",
		code: `import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "$lib/source";

// Built once per Worker isolate from compile-time data. No filesystem, no index file.
let handler: Promise<(request: Request) => Promise<Response>> | undefined;

export const GET = async ({ request }) =>
  (await (handler ??= createFromSource(source).then(createSearchHandler)))(request);`,
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
