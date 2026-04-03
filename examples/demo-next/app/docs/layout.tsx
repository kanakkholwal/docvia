import { docs } from "docvia:source";
import { Sidebar } from "../../components/Sidebar";
import type { ReactNode } from "react";

// Server Component — fetches nav tree server-side, zero client JS for layout
export default async function DocsLayout({
	children,
}: {
	children: ReactNode;
}) {
	const nav = docs.getTree();

	return (
		<div className="docs-layout">
			<header className="topbar">
				<div className="topbar-inner">
					<a href="/docs" className="topbar-brand">
						docvia
					</a>
					<span className="topbar-tagline">Next.js SSR Demo</span>
				</div>
			</header>

			<div className="docs-body">
				<Sidebar nav={nav} />

				<main className="docs-main">{children}</main>
			</div>
		</div>
	);
}
