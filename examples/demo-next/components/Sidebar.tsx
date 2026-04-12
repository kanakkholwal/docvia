"use client";

import type { PageTree } from "@docvia/source/runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
	tree: PageTree.Root;
}

export function Sidebar({ tree }: SidebarProps) {
	const pathname = usePathname();

	function renderNodes(nodes: PageTree.Node[]) {
		return nodes.map((node) => {
			if (node.type === "separator") {
				return (
					<li key={`sep-${node.name}`} className="nav-item">
						<span className="nav-group-label">{node.name}</span>
					</li>
				);
			}

			if (node.type === "folder") {
				const indexHref = node.index?.url;
				const isActive = indexHref ? pathname === indexHref : false;

				return (
					<li key={node.$id ?? node.name} className="nav-item">
						{indexHref ? (
							<Link
								href={indexHref}
								className={`nav-link${isActive ? " nav-link--active" : ""}`}
							>
								{node.name}
							</Link>
						) : (
							<span className="nav-group-label">{node.name}</span>
						)}
						{node.children.length > 0 && (
							<ul className="nav-children">{renderNodes(node.children)}</ul>
						)}
					</li>
				);
			}

			// type === "page"
			const isActive = pathname === node.url;
			return (
				<li key={node.$id ?? node.url} className="nav-item">
					<Link
						href={node.url}
						className={`nav-link${isActive ? " nav-link--active" : ""}`}
					>
						{node.name}
					</Link>
				</li>
			);
		});
	}

	return (
		<aside className="sidebar">
			<nav aria-label="Documentation navigation">
				<ul className="nav-list">{renderNodes(tree.children)}</ul>
			</nav>
		</aside>
	);
}
