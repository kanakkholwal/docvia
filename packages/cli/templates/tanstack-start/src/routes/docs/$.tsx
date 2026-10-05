import { DocviaContent } from "@docvia/renderer-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { source } from "~lib/source";

export const Route = createFileRoute("/docs/$")({
	loader: async ({ params }) => {
		const page = source.getPage(
			(params._splat ?? "").split("/").filter(Boolean),
		);
		if (!page) throw notFound();
		const { content, toc } = await page.data.load();
		return {
			title: page.data.title,
			description: page.data.description,
			content,
			toc,
		};
	},
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
				<DocviaContent nodes={content} />
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
