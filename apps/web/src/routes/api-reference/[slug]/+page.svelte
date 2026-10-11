<script lang="ts">
import Seo from "#lib/components/site/seo.svelte";
import RequestView from "#lib/components/api-workspace/request-view.svelte";
import { workspace } from "#lib/components/api-workspace/workspace.svelte.ts";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();

$effect(() => {
	workspace.open({ kind: "operation", slug: data.op.slug });
});
</script>

<Seo
	title="{data.op.summary} · API reference · docvia"
	description="Try {data.op.method.toUpperCase()} {data.op.path} from the browser in docvia's API reference workspace, built with @docvia/plugin-openapi."
/>

{#key data.op.slug}
	<RequestView op={data.op} docsUrl={data.docsUrl} proxy={data.proxy} />
{/key}
