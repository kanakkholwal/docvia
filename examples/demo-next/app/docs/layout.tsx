import { docs } from "docvia/source";
import type { ReactNode } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";

export default async function DocsLayout({
	children,
}: {
	children: ReactNode;
}) {
	const tree = docs.pageTree;

	return (
		<div className="docs-layout">
			<header className="docs-header">
				<div className="docs-header-inner">
					<div className="docs-header-left">
						<a href="/docs" className="docs-logo">
							docvia<span>docs</span>
						</a>
					</div>
					<div className="docs-header-right">
						<ThemeToggle />
					</div>
				</div>
			</header>

			<div className="docs-body">
				<Sidebar tree={tree} />
				<main className="docs-main">{children}</main>
			</div>
		</div>
	);
}
