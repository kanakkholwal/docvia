import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DocsTree } from "~components/docs-tree";
import { DocviaClient } from "~components/docvia-client";
import { source } from "~lib/source";
import docsCss from "./-docs.css?url";

// A server function keeps `lib/source.ts`, and the index of every page, out of the browser bundle.
const getTree = createServerFn({ method: "GET" }).handler(
	() => source.pageTree,
);

export const Route = createFileRoute("/docs")({
	head: () => ({ links: [{ rel: "stylesheet", href: docsCss }] }),
	loader: () => getTree(),
	component: DocsLayout,
});

function DocsLayout() {
	const tree = Route.useLoaderData();
	const pathname = useLocation({ select: (location) => location.pathname });
	return (
		<div className="docs-layout">
			<nav className="docs-sidebar">
				<DocsTree nodes={tree.children} activePath={pathname} />
			</nav>
			<Outlet />
			<DocviaClient />
		</div>
	);
}
