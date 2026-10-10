<script lang="ts">
	import { onMount, untrack } from "svelte";
	import {
		type AnimateOptions,
		createMarkdownStream,
		createMotion,
		injectStyles,
		motionStyle,
		type StreamBlock,
		type StreamOptions,
	} from "@docvia/markdown";
	import Blocks from "./Blocks.svelte";
	import type { SvelteRenderOptions } from "./context";

	// Pass the whole text so far; appended text is pushed, anything else starts a new stream.
	let {
		source,
		streaming = true,
		animate = true,
		caret = true,
		...options
	}: Omit<SvelteRenderOptions, "animate"> &
		StreamOptions & {
			source: string;
			streaming?: boolean;
			animate?: boolean | AnimateOptions;
			caret?: boolean;
		} = $props();

	let stream = untrack(() => createMarkdownStream(options));
	let fed = "";
	let blocks = $state<StreamBlock[]>([]);
	let root = $state<HTMLDivElement>();
	const motion = $derived(root ? createMotion(root) : null);
	const motionOptions = $derived(animate === false ? null : animate === true ? {} : animate);
	const style = $derived(
		Object.entries(motionOptions ? motionStyle(motionOptions) : {})
			.map(([k, v]) => `${k}:${v};`)
			.join("") + "display:contents",
	);

	$effect(() => {
		const text = source;
		const done = !streaming;
		untrack(() => {
			if (!text.startsWith(fed)) {
				stream = createMarkdownStream(options);
				fed = "";
				motion?.reset();
			}
			if (text.length > fed.length) blocks = stream.push(text.slice(fed.length));
			fed = text;
			if (done) blocks = stream.end();
		});
	});

	// Runs after the DOM reflects `blocks`, which is when words can be measured.
	$effect(() => {
		const final = !streaming;
		void blocks;
		const opts = motionOptions;
		untrack(() => motion?.update(final, opts, caret));
	});

	onMount(() => {
		if (animate || caret) injectStyles(document);
	});
</script>

<div bind:this={root} data-md-stream {style}>
	{#each blocks as b (b.key)}
		<Blocks nodes={[b.node]} options={{ ...options, animate: !!motionOptions }} />
	{/each}
</div>
