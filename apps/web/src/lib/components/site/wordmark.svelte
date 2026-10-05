<script lang="ts">
import { cn } from "#lib/cn.ts";

let { text = "docvia.", class: className }: { text?: string; class?: string } = $props();

const letters = $derived([...text]);
let shapes = $state<number[]>([]);
let el: HTMLElement;
let spans: HTMLElement[] = [];
let frame = 0;

// Letters within ~1.5 glyph widths of the pointer morph toward lines (ELSH 100).
function move(event: PointerEvent) {
	if (event.pointerType !== "mouse") return;
	const box = el.getBoundingClientRect();
	el.style.setProperty("--mx", `${event.clientX - box.left}px`);
	el.style.setProperty("--my", `${event.clientY - box.top}px`);
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(() => {
		shapes = spans.map((span) => {
			const r = span.getBoundingClientRect();
			const reach = r.width * 1.5;
			const d = Math.abs(event.clientX - (r.left + r.width / 2));
			return Math.round(100 * Math.max(0, 1 - d / reach));
		});
	});
}

function leave() {
	cancelAnimationFrame(frame);
	shapes = letters.map(() => 0);
}
</script>

<div
	bind:this={el}
	onpointermove={move}
	onpointerleave={leave}
	aria-hidden="true"
	class={cn("wordmark select-none font-pixel leading-[0.8] whitespace-nowrap", className)}
>
	{#each letters as letter, i}
		<span bind:this={spans[i]} class="letter" style="--elsh: {shapes[i] ?? 0}">{letter}</span>
	{/each}
</div>

<style>
	/* Lit by a violet light at the pointer, printed through a halftone dot mask. */
	.wordmark {
		font-size: clamp(5.5rem, 21vw, 19rem);
		letter-spacing: -0.02em;
		background: radial-gradient(360px circle at var(--mx, 30%) var(--my, 40%), var(--brand), var(--hairline-strong) 75%);
		background-clip: text;
		color: transparent;
		mask-image: radial-gradient(circle, #000 62%, transparent 64%);
		mask-size: 5px 5px;
	}
	.letter {
		display: inline-block;
		font-variation-settings: "ELSH" var(--elsh);
		transition: --elsh var(--duration-slow) var(--ease-out);
	}
	@media (prefers-reduced-motion: reduce) {
		.letter {
			transition: none;
		}
	}
</style>
