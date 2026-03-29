<script lang="ts">
  import Pagination from "$lib/components/Pagination.svelte";
  import TableOfContents from "$lib/components/TableOfContents.svelte";
  import { Renderer } from "@dockit/renderer-svelte";
  import { registry } from "dockit:source/registry";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
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
