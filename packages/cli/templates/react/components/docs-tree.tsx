import type { PageTree } from "@docvia/source";

/** The sidebar: pages, folders and separators from `source.pageTree`. */
export function DocsTree({ nodes }: { nodes: PageTree.Node[] }) {
	return (
		<ul>
			{nodes.map((node) => (
				<li key={node.type === "page" ? node.url : node.name}>
					{node.type === "page" ? (
						<a href={node.url}>{node.name}</a>
					) : node.type === "folder" ? (
						<>
							<div className="docs-folder">
								{node.index ? (
									<a href={node.index.url}>{node.name}</a>
								) : (
									node.name
								)}
							</div>
							<DocsTree nodes={node.children} />
						</>
					) : (
						<div className="docs-folder">{node.name}</div>
					)}
				</li>
			))}
		</ul>
	);
}
