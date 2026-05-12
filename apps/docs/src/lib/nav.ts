// Sidebar navigation. Hand-curated for the v0.1 starter; later this will be
// generated from the docvia source itself.
export interface NavItem {
	label: string;
	href: string;
	soon?: boolean;
}

export interface NavGroup {
	title: string;
	items: NavItem[];
}

export const nav: NavGroup[] = [
	{
		title: "Introduction",
		items: [
			{ label: "What is docvia?", href: "/" },
			{ label: "Getting started", href: "/getting-started" },
			{ label: "Project structure", href: "/project-structure", soon: true },
		],
	},
	{
		title: "Configuration",
		items: [
			{ label: "Config reference", href: "/config" },
			{ label: "Frontmatter schema", href: "/frontmatter", soon: true },
			{ label: "Renderers", href: "/renderers", soon: true },
		],
	},
	{
		title: "Pipeline",
		items: [
			{ label: "Plugins overview", href: "/plugins", soon: true },
			{ label: "OpenAPI plugin", href: "/plugins/openapi" },
			{ label: "Incremental builds", href: "/incremental-builds", soon: true },
			{ label: "Search", href: "/search", soon: true },
		],
	},
];
