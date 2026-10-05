import type { ReactNode } from "react";
import { DocsTree } from "~components/docs-tree";
import { DocviaClient } from "~components/docvia-client";
import { source } from "~lib/source";
import "./docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="docs-layout">
			<nav className="docs-sidebar">
				<DocsTree nodes={source.pageTree.children} />
			</nav>
			{children}
			<DocviaClient />
		</div>
	);
}
