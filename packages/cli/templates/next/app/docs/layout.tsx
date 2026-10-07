import type { ReactNode } from "react";
import { DocsSidebar } from "~components/docs-sidebar";
import { DocviaClient } from "~components/docvia-client";
import { source } from "~lib/source";
import "./docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="docs-layout">
			<nav className="docs-sidebar">
				<DocsSidebar tree={source.pageTree} />
			</nav>
			{children}
			<DocviaClient />
		</div>
	);
}
