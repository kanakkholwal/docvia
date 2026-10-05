import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DocsTree } from "~components/docs-tree";
import { DocviaClient } from "~components/docvia-client";
import { source } from "~lib/source";
import docsCss from "./-docs.css?url";

export const Route = createFileRoute("/docs")({
	head: () => ({ links: [{ rel: "stylesheet", href: docsCss }] }),
	component: DocsLayout,
});

function DocsLayout() {
	return (
		<div className="docs-layout">
			<nav className="docs-sidebar">
				<DocsTree nodes={source.pageTree.children} />
			</nav>
			<Outlet />
			<DocviaClient />
		</div>
	);
}
