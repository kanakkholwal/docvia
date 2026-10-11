<script lang="ts">
import { parse } from "@docvia/markdown";
import { Markdown, StreamingMarkdown } from "@docvia/markdown/svelte";
import { onDestroy } from "svelte";
import Prose from "#lib/components/docs/prose.svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import { Textarea } from "#lib/components/ui/textarea/index.ts";

const SAMPLE = `## Release notes

docvia **3.0** ships a new Markdown engine:

- [x] CommonMark + GFM
- [x] Streaming with *repair*
- [ ] Math (next)

| Package | Size |
| --- | ---: |
| parse + html | 20 KB |

\`\`\`ts
import { toHtml } from "@docvia/markdown";
\`\`\`

> Raw <b>HTML</b> is escaped, and [unsafe links](javascript:alert(1)) are dropped.`;

const ANSWER = `Short answer: **use streaming mode** when the text arrives in chunks.

### Why

1. Finished blocks are parsed *once*, so a long answer stays cheap.
2. The live tail is repaired: an open \`code span\`, a half-written [link](https://docvia.dev/docs) or an unfinished **bold run** renders as it will look.
3. Every block keeps a stable key, so frameworks patch instead of re-rendering.

\`\`\`ts
const view = createStreamRenderer(el, { animate: { effect: "blur" } });
for await (const chunk of response) view.push(chunk);
view.end();
\`\`\`

| Mode | Re-parses |
| --- | --- |
| \`toHtml()\` | everything |
| streaming | only the tail |

That's it: ~20 KB, no dependencies.`;

let tab = $state("editor");
let source = $state(SAMPLE);
const parseMs = $derived.by(() => {
	const t0 = performance.now();
	for (let i = 0; i < 20; i++) parse(source);
	return (performance.now() - t0) / 20;
});

let streamed = $state("");
let streaming = $state(false);
let effect = $state("blur");
let layout = $state(true);
let customCss = $state(`@keyframes md-custom {
  from { opacity: 0; top: -0.6em; color: var(--brand); }
}`);
const EFFECTS = ["blur", "fade", "rise", "settle", "wipe", "custom"].map((value) => ({
	value,
	label: value === "custom" ? "Custom CSS" : value[0]?.toUpperCase() + value.slice(1),
}));
const animate = $derived({ effect: effect === "custom" ? "md-custom" : effect, layout });
let speed = $state("normal");
let timer: ReturnType<typeof setTimeout> | undefined;
const SPEED: Record<string, number> = { slow: 90, normal: 45, fast: 15 };

function stop() {
	clearTimeout(timer);
	streaming = false;
}

function play() {
	stop();
	streamed = "";
	streaming = true;
	let at = 0;
	const step = () => {
		// Models send uneven chunks; 2 to 9 characters at a time shows the repair working.
		at = Math.min(ANSWER.length, at + 2 + Math.floor(Math.random() * 8));
		streamed = ANSWER.slice(0, at);
		if (at < ANSWER.length) timer = setTimeout(step, SPEED[speed]);
		else streaming = false;
	};
	step();
}

onDestroy(stop);
</script>

<svelte:head>
	{#if effect === "custom"}{@html `<style>${customCss.replace(/<\/style/gi, "")}</style>`}{/if}
</svelte:head>

<div class="not-prose my-8 rounded-xl border border-border bg-card p-1">
	<Tabs bind:value={tab} variant="segment" size="sm">
		<div class="flex flex-wrap items-center gap-2 px-2 pt-1 pb-2">
			<TabsList>
				<TabsTrigger value="editor">Live editor</TabsTrigger>
				<TabsTrigger value="stream">AI stream</TabsTrigger>
			</TabsList>
			{#if tab === "editor"}
				<span class="ml-auto text-muted text-xs">parsed in {parseMs.toFixed(2)} ms</span>
			{:else}
				<div class="ml-auto flex items-center gap-2">
					<Select type="single" bind:value={effect} items={EFFECTS}>
						<SelectTrigger size="xs" variant="ghost" aria-label="Effect" class="w-28"><SelectValue /></SelectTrigger>
						<SelectContent size="xs">
							{#each EFFECTS as e (e.value)}<SelectItem value={e.value} label={e.label} />{/each}
						</SelectContent>
					</Select>
					<Button size="xs" variant={layout ? "secondary" : "ghost"} aria-pressed={layout} onclick={() => (layout = !layout)}>Layout motion</Button>
					<Select type="single" bind:value={speed} items={[{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }]}>
						<SelectTrigger size="xs" variant="ghost" aria-label="Speed" class="w-24"><SelectValue /></SelectTrigger>
						<SelectContent size="xs">
							<SelectItem value="slow" label="Slow" /><SelectItem value="normal" label="Normal" /><SelectItem value="fast" label="Fast" />
						</SelectContent>
					</Select>
					{#if streaming}
						<Button size="xs" variant="outline" onclick={stop}>Stop</Button>
					{:else}
						<Button size="xs" onclick={play}>{streamed ? "Replay" : "Stream an answer"}</Button>
					{/if}
				</div>
			{/if}
		</div>

		<TabsContent value="editor" class="mt-0">
			<div class="grid gap-1 md:grid-cols-2">
				<Textarea
					bind:value={source}
					rows={18}
					spellcheck={false}
					aria-label="Markdown"
					class="min-h-80 rounded-[calc(var(--radius-xl)-1px-0.25rem)] border-0 bg-background font-mono text-xs"
				/>
				<div class="min-h-80 overflow-auto rounded-[calc(var(--radius-xl)-1px-0.25rem)] bg-background px-5 py-1">
					<Prose class="text-sm"><Markdown {source} /></Prose>
				</div>
			</div>
		</TabsContent>

		<TabsContent value="stream" class="mt-0">
			{#if effect === "custom"}
				<Textarea
					bind:value={customCss}
					rows={3}
					spellcheck={false}
					aria-label="Custom keyframes"
					class="mb-1 rounded-[calc(var(--radius-xl)-1px-0.25rem)] border-0 bg-background font-mono text-xs"
				/>
			{/if}
			<div class="min-h-80 rounded-[calc(var(--radius-xl)-1px-0.25rem)] bg-background px-5 py-1">
				{#if streamed}
					<Prose class="text-sm"><StreamingMarkdown source={streamed} {streaming} {animate} /></Prose>
				{:else}
					<p class="py-24 text-center text-muted text-sm">Press “Stream an answer” to replay a model’s response in uneven chunks.</p>
				{/if}
			</div>
		</TabsContent>
	</Tabs>
</div>
