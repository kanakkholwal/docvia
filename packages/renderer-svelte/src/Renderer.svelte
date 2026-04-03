<script lang="ts">
import type { ComponentRegistry, RenderOutput } from "@docvia/renderer-core";
import type { Component } from "svelte";
import Renderer from "./Renderer.svelte";

interface Props {
	nodes: RenderOutput | RenderOutput[];
	registry?: ComponentRegistry;
}

const { nodes, registry }: Props = $props();

let nodeArray = $derived.by(() => (Array.isArray(nodes) ? nodes : [nodes]));

function isElement(
	node: any,
): node is Extract<RenderOutput, { kind: "element" }> {
	return node?.kind === "element";
}
function isText(node: any): node is Extract<RenderOutput, { kind: "text" }> {
	return node?.kind === "text";
}
function isHtml(node: any): node is Extract<RenderOutput, { kind: "html" }> {
	return node?.kind === "html";
}
function isComponent(
	node: any,
): node is Extract<RenderOutput, { kind: "component" }> {
	return node?.kind === "component";
}
function isFragment(
	node: any,
): node is Extract<RenderOutput, { kind: "fragment" }> {
	return node?.kind === "fragment";
}

function asSvelteComponent(value: unknown): Component {
	return value as Component;
}
</script>

{#each nodeArray as node}
  {#if isText(node)}
    {node.value}
  {:else if isHtml(node)}
    {@html node["value"]}
  {:else if isElement(node)}
    <svelte:element this={node.tag} {...node.props} data-hid={node.id}>
      {#if node.children}
        <Renderer nodes={node.children} {registry} />
      {/if}
    </svelte:element>
  {:else if isComponent(node)}
    {@const resolved = registry?.resolve(node.name)}
    {#if resolved}
      {@const DynamicComponent = asSvelteComponent(resolved.component)}
      <div data-hid={node.id} class="docvia-component-wrapper">
        <DynamicComponent {...node.props || {}}>
          {#if node.children}
            <Renderer nodes={node.children} {registry} />
          {/if}
        </DynamicComponent>
      </div>
    {:else}
      <div class="docvia-error">Unknown component: {node.name}</div>
    {/if}
  {:else if isFragment(node)}
    <Renderer nodes={node.children} {registry} />
  {/if}
{/each}
