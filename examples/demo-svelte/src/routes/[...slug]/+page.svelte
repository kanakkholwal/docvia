<script lang="ts">
  import Counter from "$lib/components/Counter.svelte";
  import { hydrate, type ComponentRegistry } from "@dockit/renderer-core";
  import { Renderer } from "@dockit/renderer-svelte";
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const registry: ComponentRegistry = {
    resolve: (name: string) => {
      if (name === "counter") return { component: Counter };
      return null;
    },
  };
  onMount(() => {
    if (data.page.manifest) {
      hydrate(data.page.manifest, registry);
    }
  });
</script>

<Renderer nodes={data.page.content} {registry} />
