<script lang="ts">
import { browser } from "$app/environment";
import { cn } from "$lib/utils";

// Draws the diagrams that @docvia/plugin-mermaid emits. `mermaid` is loaded
// with a dynamic import so it stays out of the SSR bundle and the Cloudflare
// Worker, and off the critical path for pages with no diagrams.

type Props = { code: string; title?: string; class?: string };
let { code, title, class: className }: Props = $props();

let svg = $state("");
let failed = $state(false);

// Diagram ids must be unique per render; mermaid uses them for internal defs.
let seq = 0;

// Design tokens read off the live document, so the diagram matches whichever
// theme is active instead of shipping a second hard-coded palette.
function themeVariables() {
	const s = getComputedStyle(document.documentElement);
	const v = (name: string) => s.getPropertyValue(name).trim();
	return {
		background: v("--surface-soft"),
		primaryColor: v("--surface-card"),
		primaryTextColor: v("--ink"),
		primaryBorderColor: v("--hairline-strong"),
		secondaryColor: v("--brand-soft"),
		tertiaryColor: v("--surface-soft"),
		lineColor: v("--muted"),
		textColor: v("--body"),
		mainBkg: v("--surface-card"),
		nodeBorder: v("--hairline-strong"),
		clusterBkg: v("--surface-soft"),
		clusterBorder: v("--hairline"),
		fontFamily: v("--font-sans") || "Inter, sans-serif",
		fontSize: "14px",
	};
}

async function render() {
	const { default: mermaid } = await import("mermaid");
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		themeVariables: themeVariables(),
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

<figure class={cn("my-8 not-prose", className)}>
	<div
		class="overflow-x-auto rounded-lg border border-hairline bg-surface-soft p-6 text-center"
	>
		{#if svg}
			<!-- mermaid output; securityLevel "strict" strips scripts and inline handlers -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html svg}
		{:else}
			<!-- Fallback for SSR, no-JS, and diagrams mermaid could not parse. -->
			<pre
				class="overflow-x-auto text-left font-mono text-[12.5px] leading-relaxed text-body">{code}</pre>
			{#if failed}
				<p class="mt-3 text-[12px] text-muted">
					This diagram could not be rendered; the source is shown instead.
				</p>
			{/if}
		{/if}
	</div>
	{#if title}
		<figcaption class="mt-3 text-center text-[13px] text-muted">
			{title}
		</figcaption>
	{/if}
</figure>
