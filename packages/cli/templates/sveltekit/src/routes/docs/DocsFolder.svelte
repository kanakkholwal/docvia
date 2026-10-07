<script lang="ts">
	import type { PageTree } from '@docvia/source';
	import DocsTree from './DocsTree.svelte';

	let { folder, activePath }: { folder: PageTree.Folder; activePath: string } = $props();

	const contains = (f: PageTree.Folder, path: string): boolean =>
		f.index?.url === path ||
		f.children.some((child) =>
			child.type === 'page' ? child.url === path : child.type === 'folder' && contains(child, path)
		);

	// Open when it holds the current page; a click overrides that until the reader navigates.
	// Closed folders render nothing, so a large site does not send every link on every page.
	let open = $derived(contains(folder, activePath) || folder.defaultOpen === true);
</script>

<details {open} ontoggle={(e) => (open = e.currentTarget.open)}>
	<summary class="docs-folder">
		{#if folder.index}
			<a
				href={folder.index.url}
				aria-current={activePath === folder.index.url ? 'page' : undefined}
			>
				{folder.name}
			</a>
		{:else}
			{folder.name}
		{/if}
	</summary>
	{#if open}
		<DocsTree nodes={folder.children} {activePath} />
	{/if}
</details>
