"use client";

import { createFetchClient, type SearchResult } from "@docvia/search";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// Headless search UI: queries the `/api/search` Route Handler, which holds the
// Orama index in server memory. No index payload is shipped to the browser.
export function Search() {
	const searcher = useMemo(() => createFetchClient("/api/search"), []);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [open, setOpen] = useState(false);
	const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => {
		clearTimeout(debounce.current);
		const term = query.trim();
		if (!term) {
			setResults([]);
			return;
		}
		// `active` guards against out-of-order responses: when the query changes
		// the cleanup flips it false, so a slower in-flight request is ignored.
		let active = true;
		debounce.current = setTimeout(async () => {
			try {
				const hits = await searcher.search(term, { limit: 8 });
				if (active) setResults(hits);
			} catch {
				if (active) setResults([]);
			}
		}, 150);
		return () => {
			active = false;
			clearTimeout(debounce.current);
		};
	}, [query, searcher]);

	function hrefFor(r: SearchResult): string {
		const path = r.slug === "index" ? "/docs" : `/docs/${r.slug}`;
		return r.sectionId && r.sectionId !== "_top"
			? `${path}#${r.sectionId}`
			: path;
	}

	return (
		<search
			className="docs-search"
			onFocus={() => setOpen(true)}
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
			}}
		>
			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search docs…"
				aria-label="Search documentation"
				className="docs-search-input"
			/>
			{open && results.length > 0 && (
				<ul className="docs-search-results">
					{results.map((r) => (
						<li key={r.slug + r.sectionId}>
							<Link
								href={hrefFor(r)}
								className="docs-search-result"
								onClick={() => {
									setOpen(false);
									setQuery("");
								}}
							>
								<span className="docs-search-result-title">
									{r.sectionTitle}
								</span>
								<span className="docs-search-result-page">{r.pageTitle}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
			{open && query.trim() && results.length === 0 && (
				<div className="docs-search-results docs-search-empty">
					No results for “{query}”.
				</div>
			)}
		</search>
	);
}
