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
						<a href="/" className="docs-logo">
							<span className="docs-logo-mark" aria-hidden="true">
								▲
							</span>
							docvia<span>docs</span>
						</a>
						<span className="demo-badge demo-badge-next">
							<span className="demo-badge-dot" aria-hidden="true" />
							Next.js demo
						</span>
					</div>
					<div className="docs-header-right">
						<a
							href="/"
							className="docs-header-link"
							aria-label="Back to demo home"
						>
							← Demo home
						</a>
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
