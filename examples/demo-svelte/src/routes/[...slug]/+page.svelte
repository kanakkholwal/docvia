<script lang="ts">
  import Counter from "$lib/components/Counter.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import TableOfContents from "$lib/components/TableOfContents.svelte";
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

<div class="page-container">
  <div class="page-content">
    <article class="prose">
      <Renderer nodes={data.page.content} {registry} />
    </article>

    <Pagination pagesMeta={data.pagesMeta} />
  </div>

  <TableOfContents headings={data.page.data.headings} />
</div>

<style>
  .page-container {
    display: flex;
    gap: 4rem;
    align-items: flex-start;
  }

  .page-content {
    flex: 1;
    min-width: 0;
  }
</style>
