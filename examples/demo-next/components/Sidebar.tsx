"use client";

import type { PageTree } from "@docvia/source/runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
	tree: PageTree.Root;
}

export function Sidebar({ tree }: SidebarProps) {
	const pathname = usePathname();

	return (
		<aside className="sidebar">
			<nav aria-label="Documentation">
				<ul className="nav-list">
					<NavNodes nodes={tree.children} pathname={pathname} />
				</ul>
			</nav>
		</aside>
	);
}

function NavNodes({
	nodes,
	pathname,
}: {
	nodes: PageTree.Node[];
	pathname: string;
}) {
	return (
		<>
			{nodes.map((node, i) => (
				<NavNode
					key={
						"$id" in node
							? (node.$id ?? `${node.type}-${i}`)
							: `${node.type}-${i}`
					}
					node={node}
					pathname={pathname}
				/>
			))}
		</>
	);
}

function NavNode({
	node,
	pathname,
}: {
	node: PageTree.Node;
	pathname: string;
}) {
	if (node.type === "separator") {
		return (
			<li className="nav-section">
				<span className="nav-section-label">{node.name}</span>
			</li>
		);
	}

	if (node.type === "folder") {
		return <NavFolder folder={node} pathname={pathname} />;
	}

	const isActive = pathname === node.url;
	return (
		<li>
			<Link
				href={"/docs" + node.url}
				className={`nav-link${isActive ? " nav-link--active" : ""}`}
			>
				{node.name}
			</Link>
		</li>
	);
}

function NavFolder({
	folder,
	pathname,
}: {
	folder: PageTree.Folder;
	pathname: string;
}) {
	const isChildActive = hasActiveChild(folder, pathname);
	const [open, setOpen] = useState(isChildActive);

	return (
		<li className="nav-section">
			<button
				className="nav-folder-toggle"
				data-open={open}
				onClick={() => setOpen(!open)}
				type="button"
			>
				{folder.name}
				<svg viewBox="0 0 16 16" fill="currentColor">
					<path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
				</svg>
			</button>
			{open && (
				<ul className="nav-children">
					{folder.index && (
						<li>
							<Link
								href={folder.index.url}
								className={`nav-link${pathname === folder.index.url ? " nav-link--active" : ""}`}
							>
								Overview
							</Link>
						</li>
					)}
					<NavNodes nodes={folder.children} pathname={pathname} />
				</ul>
			)}
		</li>
	);
}

function hasActiveChild(folder: PageTree.Folder, pathname: string): boolean {
	if (folder.index && pathname === folder.index.url) return true;
	for (const child of folder.children) {
		if (child.type === "page" && pathname === child.url) return true;
		if (child.type === "folder" && hasActiveChild(child, pathname)) return true;
	}
	return false;
}
