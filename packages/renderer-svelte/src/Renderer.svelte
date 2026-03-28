<script lang="ts">
    import type {
      ComponentRegistry,
      RenderOutput,
    } from "@dockit/renderer-core";

    interface Props {
        nodes: RenderOutput | RenderOutput[];
        registry: ComponentRegistry;
    }

    const { nodes, registry }: Props = $props();

    let nodeArray = $derived.by(() => Array.isArray(nodes) ? nodes : [nodes]);

    function isElement(
        node: any,
    ): node is Extract<RenderOutput, { kind: "element" }> {
        return node?.kind === "element";
    }

    function isText(
        node: any,
    ): node is Extract<RenderOutput, { kind: "text" }> {
        return node?.kind === "text";
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
</script>{#each nodeArray as node}
    {#if isText(node)}
        {node.value}
    {:else if isElement(node)}
        <svelte:element this={node.tag} {...node.props} data-hid={node.id}>
            {#if node.children}
                <svelte:self nodes={node.children} {registry} />
            {/if}
        </svelte:element>
    {:else if isComponent(node)}
        {@const resolved = registry.resolve(node.name)}
        {#if resolved}
            <div data-hid={node.id} class="dockit-component-wrapper">
                <svelte:component
                    this={resolved.component}
                    {...node.props || {}}
                >
                    {#if node.children}
                        <svelte:self nodes={node.children} {registry} />
                    {/if}
                </svelte:component>
            </div>
        {:else}
            <div class="dockit-error">Unknown component: {node.name}</div>
        {/if}
    {:else if isFragment(node)}
        <svelte:self nodes={node.children} {registry} />
    {/if}
{/each}
