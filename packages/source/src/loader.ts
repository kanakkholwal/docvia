import type { PageTree } from "./runtime";

/** `meta.json` in a content folder (fumadocs-compatible subset). */
export interface MetaData {
	title?: string;
	/** Order of children: names, `...` (the rest), `---Label---`, `!name`, `[Text](url)`. */
	pages?: string[];
	defaultOpen?: boolean;
	root?: boolean;
}

export interface PageFile<D> {
	type: "page";
	/** Path relative to the collection directory, posix (`guide/install.md`). */
	path: string;
	/** Overrides the path-derived slugs (e.g. from a frontmatter `slug`). */
	slugs?: string[];
	data: D;
}

export interface MetaFile {
	type: "meta";
	/** `guide/meta.json` */
	path: string;
	data: MetaData;
}

export interface Source<D> {
	files: Array<PageFile<D> | MetaFile>;
}

export interface Page<D> {
	slugs: string[];
	url: string;
	/** Source path relative to the collection directory. */
	path: string;
	data: D;
}

export interface LoaderOptions<D> {
	baseUrl: string;
	source: Source<D>;
}

export interface LoaderOutput<D> {
	getPage(slugs?: string[]): Page<D> | undefined;
	getPages(): Page<D>[];
	getPageTree(): PageTree.Root;
	readonly pageTree: PageTree.Root;
	/** Resolve a link like `/docs/guide#setup` to its page and hash. */
	getPageByHref(href: string): { page: Page<D>; hash?: string } | undefined;
	generateParams<K extends string = "slug">(
		key?: K,
	): Array<Record<K, string[]>>;
	/** fumadocs parity: page trees here hold plain strings, so this is the identity. */
	serializePageTree(tree: PageTree.Root): Promise<PageTree.Root>;
}

const dirOf = (path: string) => path.split("/").slice(0, -1).join("/");
const baseName = (path: string) =>
	(path.split("/").at(-1) ?? path).replace(/\.\w+$/, "");

function slugsFromPath(path: string): string[] {
	const parts = path.replace(/\.md$/, "").split("/");
	if (parts.at(-1) === "index") parts.pop();
	return parts;
}

function titleCase(segment: string): string {
	return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function loader<D extends { title?: string; order?: number }>(
	options: LoaderOptions<D>,
): LoaderOutput<D> {
	const base = options.baseUrl.replace(/\/$/, "");
	const url = (slugs: string[]) =>
		slugs.length ? `${base}/${slugs.join("/")}` : base || "/";

	const pages: Page<D>[] = [];
	const metas = new Map<string, MetaData>();
	for (const file of options.source.files) {
		if (file.type === "meta") {
			metas.set(dirOf(file.path), file.data);
			continue;
		}
		const slugs = file.slugs ?? slugsFromPath(file.path);
		pages.push({ slugs, url: url(slugs), path: file.path, data: file.data });
	}
	const byKey = new Map(pages.map((p) => [p.slugs.join("/"), p]));
	// Every folder that holds a page or a meta.json, ancestors included.
	const allDirs = new Set<string>();
	for (const path of [...pages.map((p) => dirOf(p.path)), ...metas.keys()]) {
		for (let d = path; d; d = dirOf(d)) allDirs.add(d);
	}
	const byUrl = new Map(pages.map((p) => [p.url, p]));

	const pageTitle = (p: Page<D>) => p.data.title ?? titleCase(baseName(p.path));
	const item = (p: Page<D>): PageTree.Item => ({
		type: "page",
		name: pageTitle(p),
		url: p.url,
		$id: p.path,
	});

	function folder(dir: string): PageTree.Folder {
		const meta = metas.get(dir);
		const index = pages.find(
			(p) => p.path === (dir ? `${dir}/index.md` : "index.md"),
		);
		const childPages = pages.filter(
			(p) => dirOf(p.path) === dir && p !== index,
		);
		const childDirs = [...allDirs].filter((d) => d !== "" && dirOf(d) === dir);
		const named = new Map<string, () => PageTree.Node>();
		for (const p of childPages) named.set(baseName(p.path), () => item(p));
		for (const d of childDirs) named.set(baseName(d), () => folder(d));

		// A folder sorts by its index page's `order`.
		const order = (key: string) => {
			const sub = dir ? `${dir}/${key}` : key;
			const p =
				childPages.find((x) => baseName(x.path) === key) ??
				pages.find((x) => x.path === `${sub}/index.md`);
			return p?.data.order ?? Number.POSITIVE_INFINITY;
		};
		const rest = [...named.keys()].sort(
			(a, b) => order(a) - order(b) || a.localeCompare(b),
		);
		const children: PageTree.Node[] = [];
		const used = new Set<string>();
		const excluded = new Set(
			(meta?.pages ?? [])
				.filter((e) => e.startsWith("!"))
				.map((e) => e.slice(1)),
		);
		for (const entry of meta?.pages ?? ["..."]) {
			const separator = /^---(.*)---$/.exec(entry);
			const link = /^\[(.+)\]\((.+)\)$/.exec(entry);
			if (separator)
				children.push({ type: "separator", name: separator[1] ?? "" });
			else if (link) {
				const href = link[2] ?? "";
				children.push({
					type: "page",
					name: link[1] ?? href,
					url: href,
					external: /^https?:\/\//.test(href),
				});
			} else if (entry === "...") {
				for (const key of rest) {
					if (used.has(key) || excluded.has(key)) continue;
					used.add(key);
					children.push((named.get(key) as () => PageTree.Node)());
				}
			} else if (
				!entry.startsWith("!") &&
				named.has(entry) &&
				!used.has(entry)
			) {
				used.add(entry);
				children.push((named.get(entry) as () => PageTree.Node)());
			}
		}
		return {
			type: "folder",
			name:
				meta?.title ?? (index ? pageTitle(index) : titleCase(baseName(dir))),
			children,
			...(index ? { index: item(index) } : {}),
			...(meta?.defaultOpen !== undefined
				? { defaultOpen: meta.defaultOpen }
				: {}),
			...(meta?.root ? { root: true } : {}),
			$id: dir,
		};
	}

	let tree: PageTree.Root | undefined;
	const getPageTree = (): PageTree.Root => {
		if (!tree) {
			const root = folder("");
			// The top-level index is a normal first page, not a folder index.
			const children = root.index
				? [root.index, ...root.children]
				: root.children;
			tree = { name: metas.get("")?.title ?? "Docs", children };
		}
		return tree;
	};

	return {
		getPage: (slugs = []) => byKey.get(slugs.filter(Boolean).join("/")),
		getPages: () => pages,
		getPageTree,
		get pageTree() {
			return getPageTree();
		},
		getPageByHref(href) {
			const [path = "", hash] = href.split("#");
			const page = byUrl.get(path.replace(/\/$/, "") || "/");
			return page ? { page, ...(hash ? { hash } : {}) } : undefined;
		},
		generateParams: <K extends string = "slug">(key = "slug" as K) =>
			pages.map((p) => ({ [key]: p.slugs }) as Record<K, string[]>),
		serializePageTree: async (t) => t,
	};
}
