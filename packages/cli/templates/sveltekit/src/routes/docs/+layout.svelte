<script lang="ts">
	import type { PageTree } from '@docvia/source';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import './docs.css';

	let { data, children }: LayoutProps = $props();
</script>

{#snippet tree(nodes: PageTree.Node[])}
	<ul>
		{#each nodes as node (node.type === 'page' ? node.url : node.name)}
			<li>
				{#if node.type === 'page'}
					<a href={node.url} aria-current={page.url.pathname === node.url ? 'page' : undefined}>
						{node.name}
					</a>
				{:else if node.type === 'folder'}
					<div class="docs-folder">{node.name}</div>
					{@render tree(node.children)}
				{:else}
					<div class="docs-folder">{node.name}</div>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<div class="docs-layout">
	<nav class="docs-sidebar">{@render tree(data.tree.children)}</nav>
	{@render children()}
</div>
