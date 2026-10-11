"use client";

import type { PageTree } from "@docvia/core/source";
import { useEffect, useState } from "react";

type Props = { nodes: PageTree.Node[]; activePath: string };

const contains = (folder: PageTree.Folder, path: string): boolean =>
	folder.index?.url === path ||
	folder.children.some((child) =>
		child.type === "page"
			? child.url === path
			: child.type === "folder" && contains(child, path),
	);

/**
 * The sidebar. Folders start closed unless they hold the current page, and a closed folder renders
 * nothing, so a large docs site does not render every link on every page.
 */
export function DocsTree({ nodes, activePath }: Props) {
	return (
		<ul>
			{nodes.map((node, i) => (
				// Separators and folders have no id, and siblings may share a name.
				<li key={node.type === "page" ? node.url : `${node.type}-${i}`}>
					{node.type === "page" ? (
						<a
							href={node.url}
							aria-current={node.url === activePath ? "page" : undefined}
						>
							{node.name}
						</a>
					) : node.type === "folder" ? (
						<Folder folder={node} activePath={activePath} />
					) : (
						<div className="docs-folder">{node.name}</div>
					)}
				</li>
			))}
		</ul>
	);
}

function Folder({
	folder,
	activePath,
}: {
	folder: PageTree.Folder;
	activePath: string;
}) {
	const holdsActive = contains(folder, activePath);
	const [open, setOpen] = useState(
		() => holdsActive || folder.defaultOpen === true,
	);
	// Client navigation keeps the sidebar mounted; open the folder the reader moved into.
	useEffect(() => {
		if (contains(folder, activePath)) setOpen(true);
	}, [folder, activePath]);
	return (
		<details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
			<summary className="docs-folder">
				{folder.index ? (
					<a
						href={folder.index.url}
						aria-current={folder.index.url === activePath ? "page" : undefined}
					>
						{folder.name}
					</a>
				) : (
					folder.name
				)}
			</summary>
			{open && <DocsTree nodes={folder.children} activePath={activePath} />}
		</details>
	);
}
