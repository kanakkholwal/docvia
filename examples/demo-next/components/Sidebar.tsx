"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavNode {
	name: string;
	slug?: string;
	title?: string;
	children: NavNode[];
}

interface SidebarProps {
	nav: NavNode[];
}

export function Sidebar({ nav }: SidebarProps) {
	const pathname = usePathname();

	function getHref(node: NavNode): string {
		if (!node.slug) return "/docs";
		return node.slug === "index" ? "/docs" : `/docs/${node.slug}`;
	}

	function renderNodes(nodes: NavNode[]) {
		return nodes.map((node) => {
			const href = getHref(node);
			const isActive = pathname === href;

			return (
				<li key={node.slug ?? node.name} className="nav-item">
					{node.slug ? (
						<Link
							href={href}
							className={`nav-link${isActive ? " nav-link--active" : ""}`}
						>
							{node.title ?? node.name}
						</Link>
					) : (
						<span className="nav-group-label">{node.title ?? node.name}</span>
					)}
					{node.children.length > 0 && (
						<ul className="nav-children">{renderNodes(node.children)}</ul>
					)}
				</li>
			);
		});
	}

	return (
		<aside className="sidebar">
			<nav aria-label="Documentation navigation">
				<ul className="nav-list">{renderNodes(nav)}</ul>
			</nav>
		</aside>
	);
}
