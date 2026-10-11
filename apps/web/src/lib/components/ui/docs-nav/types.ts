import type { BadgeVariant } from "#lib/components/ui/badge/variants.js";

export interface DocsNavItem {
	href: string;
	label: string;
	/** Small pill after the label, e.g. a status like "beta". */
	badge?: string;
	/** Badge colour; the Badge default when omitted. */
	badgeVariant?: BadgeVariant;
}

export interface DocsNavSection {
	id: string;
	label: string;
	/** Shown beside the section label, e.g. how many links it holds. */
	count?: number | string;
	items: DocsNavItem[];
}
