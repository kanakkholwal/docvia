<script lang="ts" module>
// Shared by every diagram on the page: mermaid styles each SVG by id, so a per-instance counter made two diagrams clash.
let seq = 0;
</script>

<script lang="ts">
import { browser } from "$app/env";
import { cn } from "#lib/utils.ts";

// Draws the diagrams that @docvia/plugin-mermaid emits. `mermaid` is loaded
// with a dynamic import so it stays out of the SSR bundle and the Cloudflare
// Worker, and off the critical path for pages with no diagrams.

type Props = { code: string; title?: string; class?: string };
let { code, title, class: className }: Props = $props();

let svg = $state("");
let failed = $state(false);


// Tokens are oklch(), which mermaid's colour parser rejects; a 1px canvas resolves each to sRGB hex.
let probe: CanvasRenderingContext2D | null = null;
function hex(color: string): string {
	probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
	if (!probe || !color) return color;
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = getComputedStyle(document.body).backgroundColor;
	probe.fillRect(0, 0, 1, 1);
	probe.fillStyle = color;
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
	return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

// Design tokens read off the live document, so the diagram matches whichever theme is active.
function themeVariables() {
	const s = getComputedStyle(document.documentElement);
	const v = (name: string) => hex(s.getPropertyValue(name).trim());
	return {
		background: v("--well-body"),
		primaryColor: v("--well-rim"),
		primaryTextColor: v("--ink"),
		primaryBorderColor: v("--hairline-strong"),
		secondaryColor: v("--brand-soft"),
		tertiaryColor: v("--surface-soft"),
		lineColor: v("--muted"),
		textColor: v("--body"),
		mainBkg: v("--well-rim"),
		nodeBorder: v("--hairline-strong"),
		clusterBkg: v("--well-body"),
		clusterBorder: v("--hairline"),
		// `--font-sans` lives in @theme inline, which emits no variable; measure with the face the page uses.
		fontFamily: getComputedStyle(document.body).fontFamily,
		fontSize: "14px",
	};
}

async function render() {
	// Mermaid sizes every node by measuring its label. Measuring before the
	// webfont loads yields metrics for the fallback face and the text then
	// overflows the box it was given.
	await document.fonts?.ready;

	const { default: mermaid } = await import("mermaid");
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		themeVariables: themeVariables(),
		flowchart: { htmlLabels: true, useMaxWidth: true, padding: 12, wrappingWidth: 240 },
		sequence: { useMaxWidth: true },
	});
	seq += 1;
	const { svg: out } = await mermaid.render(`docvia-mermaid-${seq}`, code);
	return out;
}

$effect(() => {
	if (!browser) return;

	// Re-render when the theme flips: the toggle swaps data-theme on <html>,
	// and mermaid bakes colours into the SVG rather than reading them live.
	const observer = new MutationObserver(() => void draw());
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});

	let current = true;
	async function draw() {
		try {
			const out = await render();
			if (current) {
				svg = out;
				failed = false;
			}
		} catch {
			if (current) failed = true;
		}
	}
	void draw();

	return () => {
		current = false;
		observer.disconnect();
	};
});
</script>

<figure class={cn("my-8", className)}>
	<div
		class="overflow-x-auto rounded-2xl border-4 border-well-rim bg-well-body p-6 text-center"
	>
		{#if svg}
			<!-- mermaid output; securityLevel "strict" strips scripts and inline handlers -->
			<div class="diagram">{@html svg}</div>
		{:else}
			<!-- Fallback for SSR, no-JS, and diagrams mermaid could not parse. -->
			<pre
				class="overflow-x-auto text-left font-mono text-xs leading-relaxed text-body">{code}</pre>
			{#if failed}
				<p class="mt-3 text-xs text-muted">
					This diagram could not be rendered; the source is shown instead.
				</p>
			{/if}
		{/if}
	</div>
	{#if title}
		<figcaption class="mt-3 text-center font-mono text-xs text-muted">
			{title}
		</figcaption>
	{/if}
</figure>

<style>
	/* Mermaid puts label text in <p> inside a foreignObject. The prose styles
	   wrapping this component would add margins the label box was not sized
	   for, clipping the text. */
	.diagram :global(p),
	.diagram :global(span),
	.diagram :global(li) {
		margin: 0;
		padding: 0;
		line-height: 1.35;
		text-align: center;
		/* Mermaid sizes boxes for wrapped labels; an inherited nowrap overflowed them. */
		white-space: break-spaces;
	}

	.diagram :global(svg) {
		max-width: 100%;
		height: auto;
		display: block;
		margin-inline: auto;
	}

	/* Labels must be free to define their own height; a clipped foreignObject
	   is what produces the cut-off second line. */
	.diagram :global(foreignObject) {
		overflow: visible;
	}

	.diagram :global(.nodeLabel),
	.diagram :global(.edgeLabel),
	.diagram :global(.cluster-label) {
		white-space: nowrap;
	}
</style>
