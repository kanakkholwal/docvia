import { DocviaContent } from '@docvia/renderer-react';
import { docs } from 'docvia:source';
import { registry } from 'docvia:source/registry';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocviaHydrator } from '../../../components/DocviaHydrator';

interface PageProps {
    params: Promise<{ slug?: string[] }>;
}

// Pre-render all known slugs at build time (SSG) — works with SSR too
export async function generateStaticParams() {
    return docs.getAllPages().map(slug => ({
        slug: slug === 'index' ? [] : slug.split('/'),
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await docs.getPage(slug ?? []);
    if (!page) return {};
    return {
        title: page.data.title,
        description: page.data.description,
    };
}

export default async function DocPage({ params }: PageProps) {
    const { slug } = await params;
    const page = await docs.getPage(slug ?? []);

    if (!page) notFound();

    return (
        <div className="doc-page">
            <article className="prose">
                {/*
                  DocviaContent is a React Server Component — no 'use client'.
                  Renders the pre-compiled RenderOutput tree server-side, including
                  any 'use client' components from the registry (Counter, etc.).

                  components.a → next/link for client-side navigation without full reload.
                  components.img → could be next/image for optimised images.
                */}
                <DocviaContent
                    nodes={page.content}
                    registry={registry}
                    components={{
                        a: ({ href, children, ...props }) => (
                            <Link href={href ?? '/'} {...props}>{children}</Link>
                        ),
                    }}
                />
            </article>

            {/*
              DocviaHydrator runs client:load / client:idle / client:visible
              hydration for interactive component islands.

              In the App Router, RSC-rendered Client Components (like Counter)
              are hydrated automatically by React — no manual hydrate() needed
              for them. DocviaHydrator handles the deferred island cases
              (client:idle, client:visible) that React SSR doesn't cover.

              Serialising the manifest (plain JSON) is safe across RSC boundary.
            */}
            {page.manifest.length > 0 && (
                <DocviaHydrator manifest={page.manifest} />
            )}

            {page.headings && page.headings.length > 0 && (
                <nav className="toc" aria-label="Table of contents">
                    <p className="toc-title">On this page</p>
                    <ul className="toc-list">
                        {page.headings.map(h => (
                            <li key={h.id} className={`toc-item toc-depth-${h.depth}`}>
                                <a href={`#${h.id}`} className="toc-link">{h.text}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
}
