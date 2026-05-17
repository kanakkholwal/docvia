<script lang="ts">
import "../app.css";
import '@fontsource-variable/geist/wght.css';

let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{@render children()}
