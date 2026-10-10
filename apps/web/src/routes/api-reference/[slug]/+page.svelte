<script lang="ts">
import RequestView from "#lib/components/api-workspace/request-view.svelte";
import { workspace } from "#lib/components/api-workspace/workspace.svelte.ts";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();

$effect(() => {
	workspace.open({ kind: "operation", slug: data.op.slug });
});
</script>

<svelte:head>
	<title>{data.op.summary} · API reference · docvia</title>
</svelte:head>

{#key data.op.slug}
	<RequestView op={data.op} docsUrl={data.docsUrl} proxy={data.proxy} />
{/key}
