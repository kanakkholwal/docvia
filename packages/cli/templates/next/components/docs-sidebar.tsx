"use client";

import type { PageTree } from "@docvia/core/source";
import { usePathname } from "next/navigation";
import { DocsTree } from "~components/docs-tree";

/** The layout is a server component, so the current path comes from this client wrapper. */
export function DocsSidebar({ tree }: { tree: PageTree.Root }) {
	return <DocsTree nodes={tree.children} activePath={usePathname()} />;
}
