<script lang="ts">
  import type { PageProps } from "./$types";
  import { hydrate, type ComponentRegistry } from "@dockit/renderer-core";
  import { Renderer } from "@dockit/renderer-svelte";
  import { onMount } from "svelte";
  let { data }: PageProps = $props();

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
