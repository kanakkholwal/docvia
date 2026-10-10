<script lang="ts">
import { page } from "$app/state";
import { cn } from "#lib/cn.ts";
import NavGroup from "#lib/components/docs/nav-group.svelte";
import type { PageTree } from "@docvia/core/source";

// The tree is docvia's own page tree for the `docs` collection (+layout.server.ts).
let { tree, mobile = false }: { tree: PageTree.Root; mobile?: boolean } = $props();

type Group = { title: string; prefix: string; items: { label: string; url: string }[] };

// Eighteen names starting "@docvia/" cost a scan per row; the group shows the prefix once.
function sharedPrefix(names: string[]): string {
	if (names.length < 3) return "";
	const cut = names[0].indexOf("/");
	const candidate = cut < 0 ? "" : names[0].slice(0, cut + 1);
	return candidate && names.every((n) => n.startsWith(candidate)) ? candidate : "";
}

const groups = $derived.by<Group[]>(() => {
	const start = tree.children.filter((n) => n.type === "page");
	const out: Group[] = start.length
		? [{ title: "Start", prefix: "", items: start.map((p) => ({ label: p.name, url: p.url })) }]
		: [];
	for (const folder of tree.children) {
		if (folder.type !== "folder") continue;
		const pages = folder.children.flatMap((child) =>
			child.type === "page" ? [child] : child.type === "folder" && child.index ? [child.index] : [],
		);
		const prefix = sharedPrefix(pages.map((p) => p.name));
		out.push({
			title: folder.name,
			prefix,
			items: [
				...(folder.index ? [{ label: "Overview", url: folder.index.url }] : []),
				...pages.map((p) => ({ label: p.name.slice(prefix.length), url: p.url })),
			],
		});
	}
	return out;
});

let scrollEl = $state<HTMLElement | null>(null);

// Landing deep in a long group would otherwise show the rail scrolled to the top.
$effect(() => {
	page.url.pathname;
	const box = scrollEl;
	const el = box?.querySelector<HTMLElement>("[aria-current='page']");
	if (!box || !el) return;
	const top = el.offsetTop;
	if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
		box.scrollTo({ top: top - box.clientHeight / 2, behavior: "instant" });
	}
});
</script>

<div
	bind:this={scrollEl}
	class={cn("relative", !mobile && "sticky top-16 -ml-2 max-h-[calc(100vh-4rem)] overflow-y-auto pl-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}
>
	<div class="pr-4 pb-8">
		{#each groups as group, i (group.title)}
			<NavGroup {...group} first={i === 0} {mobile} />
		{/each}
	</div>
</div>
