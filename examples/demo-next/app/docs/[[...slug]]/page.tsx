import { DocviaHydrator } from "@/components/DocviaHydrator";
import { DocviaContent } from "@docvia/renderer-react";
import { docs, registry } from "docvia:source";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{ slug?: string[] }>;
}

// Pre-render all known slugs at build time (SSG)
export async function generateStaticParams() {
	return docs.generateParams();
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const page = await docs.getPage(slug);
	if (!page) return {};
	return {
		title: page.data.title,
		description: page.data.description,
	};
}

export default async function DocPage({ params }: PageProps) {
	const { slug } = await params;
	const page = await docs.getPage(slug);

	if (!page) notFound();

	return (
		<div className="doc-page">
			<article className="prose">
				<DocviaContent
					nodes={page.content}
					registry={registry}
					components={{
						a: ({ href, children, ...props }) => (
							<Link href={href ?? "/"} {...props}>
								{children}
							</Link>
						),
					}}
				/>
			</article>

			{page.manifest.length > 0 && <DocviaHydrator manifest={page.manifest} />}

			{page.headings && page.headings.length > 0 && (
				<nav className="toc" aria-label="Table of contents">
					<p className="toc-title">On this page</p>
					<ul className="toc-list">
						{page.headings.map((h) => (
							<li key={h.id} className={`toc-item toc-depth-${h.depth}`}>
								<a href={`#${h.id}`} className="toc-link">
									{h.text}
								</a>
							</li>
						))}
					</ul>
				</nav>
			)}
		</div>
	);
}
