import { Renderer } from "@docvia/core/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "~lib/source";

interface Props {
	params: Promise<{ slug?: string[] }>;
}

export default async function DocsPage({ params }: Props) {
	const page = source.getPage((await params).slug);
	if (!page) notFound();
	const { content, toc } = await page.data.load();

	return (
		<>
			<article className="docs-content">
				<h1>{page.data.title}</h1>
				{page.data.description && (
					<p className="docs-description">{page.data.description}</p>
				)}
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

export function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const page = source.getPage((await params).slug);
	return page
		? { title: page.data.title, description: page.data.description }
		: {};
}
