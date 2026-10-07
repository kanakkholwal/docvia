<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import DocsTree from './DocsTree.svelte';
	import './docs.css';

	let { data, children }: LayoutProps = $props();
</script>

<div class="docs-layout">
	<nav class="docs-sidebar">
		<DocsTree nodes={data.tree.children} activePath={page.url.pathname} />
	</nav>
	{@render children()}
</div>
