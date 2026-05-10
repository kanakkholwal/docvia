<script lang="ts">
import Layout from "$lib/components/Layout.svelte";

let { data, children } = $props();
</script>

<Layout tree={data.tree} {children} />
