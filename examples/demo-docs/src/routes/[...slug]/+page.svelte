<script lang="ts">
    import Counter from "$lib/components/Counter.svelte";
    import { hydrate, type ComponentRegistry } from "@dockit/renderer-core";
    import { Renderer } from "@dockit/renderer-svelte";
    import { onMount } from "svelte";

    export let data;

    const registry: ComponentRegistry = {
        resolve: (name: string) => {
            if (name === "counter") return { component: Counter };
            return null;
        },
    };

    onMount(() => {
        hydrate(data.page.manifest, registry);
    });
</script>

<Renderer nodes={data.page.content} {registry} />
