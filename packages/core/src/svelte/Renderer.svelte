<script lang="ts">
import { installCodeGroups, installCopyButtons } from "@docvia/core/render/client";
import { onMount } from "svelte";
import Nodes from "./Nodes.svelte";
import type { RendererProps } from "./types";

const { nodes, registry, components }: RendererProps = $props();

onMount(() => {
	installCodeGroups();
	installCopyButtons();
});
</script>

<Nodes {nodes} {registry} {components} />
