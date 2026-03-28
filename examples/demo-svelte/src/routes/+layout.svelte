<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import Topbar from "$lib/components/Topbar.svelte";
	import "../app.css";

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Dockit Documentation</title>
</svelte:head>

<div class="app-layout">
	<Topbar nav={data.nav} />

	<div class="main-container">
		<aside class="sidebar">
			<div class="sidebar-sticky">
				<Sidebar nav={data.nav} />
			</div>
		</aside>

		<main class="content-area">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-container {
		display: flex;
		flex: 1;
		max-width: 1440px;
		margin: 0 auto;
		width: 100%;
	}

	.sidebar {
		width: var(--sidebar-width);
		border-right: 1px solid var(--border);
		flex-shrink: 0;
	}

	.sidebar-sticky {
		position: sticky;
		top: var(--header-height);
		height: calc(100vh - var(--header-height));
		overflow-y: auto;
	}

	.content-area {
		flex: 1;
		min-width: 0;
		padding: 2rem 3rem;
	}

	.content-wrapper {
		max-width: 800px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}
	}
</style>
