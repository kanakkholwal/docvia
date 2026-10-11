import { Renderer } from "@docvia/core/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { source } from "~lib/source";

// Runs on the server only, so page bodies load there and the browser receives just this page.
const getPage = createServerFn({ method: "GET" })
	.inputValidator((slugs: string[]) => slugs)
	.handler(async ({ data: slugs }) => {
		const page = source.getPage(slugs);
		if (!page) throw notFound();
		const { content, toc } = await page.data.load();
		return {
			title: page.data.title,
			description: page.data.description,
			content,
			toc,
		};
	});

export const Route = createFileRoute("/docs/$")({
	loader: ({ params }) =>
		getPage({ data: (params._splat ?? "").split("/").filter(Boolean) }),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: loaderData.title },
					{ name: "description", content: loaderData.description },
				]
			: [],
	}),
	component: DocsPage,
});

function DocsPage() {
	const { title, description, content, toc } = Route.useLoaderData();
	return (
		<>
			<article className="docs-content">
				<h1>{title}</h1>
				{description && <p className="docs-description">{description}</p>}
				<Renderer nodes={content} />
			</article>
			<aside className="docs-toc">
				<p>On this page</p>
				<ul>
					{toc.map((item) => (
						<li key={item.url} style={{ paddingLeft: (item.depth - 2) * 12 }}>
							<a href={item.url}>{item.title}</a>
						</li>
					))}
				</ul>
			</aside>
		</>
	);
}
