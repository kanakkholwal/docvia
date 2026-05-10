import { DocviaContent } from "@docvia/renderer-react";
import { docs, registry } from "docvia/source";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocviaHydrator } from "@/components/DocviaHydrator";

interface PageProps {
	params: Promise<{ slug?: string[] }>;
}

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

	const allPages = docs.getPages();
	const currentSlug = page.slugs.join("/") || "index";
	const currentIndex = allPages.findIndex(
		(p) => (p.slugs.join("/") || "index") === currentSlug,
	);
	const prev = currentIndex > 0 ? allPages[currentIndex - 1] : null;
	const next =
		currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

	return (
		<div className="doc-page">
			<article className="doc-content">
				<div className="prose">
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
				</div>

				{(prev || next) && (
					<nav className="pagination" aria-label="Pagination">
						{prev ? (
							<Link href={`/docs${prev.url}`} className="pagination-link">
								<span className="pagination-label">Previous</span>
								<span className="pagination-title">
									{prev.data?.title || "Previous"}
								</span>
							</Link>
						) : (
							<div />
						)}
						{next ? (
							<Link
								href={`/docs${next.url}`}
								className="pagination-link pagination-link--next"
							>
								<span className="pagination-label">Next</span>
								<span className="pagination-title">
									{next.data?.title || "Next"}
								</span>
							</Link>
						) : (
							<div />
						)}
					</nav>
				)}

				{page.manifest.length > 0 && (
					<DocviaHydrator manifest={page.manifest} />
				)}
			</article>

			{page.headings && page.headings.length > 0 && (
				<aside className="toc" aria-label="Table of contents">
					<p className="toc-title">On this page</p>
					<ul className="toc-list">
						{page.headings
							.filter((h) => h.depth <= 3)
							.map((h) => (
								<li
									key={h.id}
									className={`toc-item${h.depth === 3 ? " toc-depth-3" : ""}`}
								>
									<a href={`#${h.id}`} className="toc-link">
										{h.text}
									</a>
								</li>
							))}
					</ul>
				</aside>
			)}
		</div>
	);
}
