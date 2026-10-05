<script lang="ts">
import { cn } from "#lib/cn.js";
import {
	type TextLoopDirection,
	type TextLoopSize,
	type TextLoopVariant,
	textLoop,
	textLoopRollStep,
} from "./variants";

let {
	items,
	index: indexProp,
	defaultIndex = 0,
	onIndexChange,
	intervalMs = 1000,
	durationMs = 300,
	variant = "slide",
	direction = "up",
	size = "inherit",
	class: className,
}: {
	items: string[];
	/** Controlled: which item is showing. Omit to let the component loop on its own. */
	index?: number;
	defaultIndex?: number;
	onIndexChange?: (index: number) => void;
	/** Time each item stays before the next. Only runs while uncontrolled. */
	intervalMs?: number;
	/** Enter and exit length, in ms. */
	durationMs?: number;
	variant?: TextLoopVariant;
	direction?: TextLoopDirection;
	size?: TextLoopSize;
	class?: string;
} = $props();

type Shown = { index: number; key: number };
type Roll = { index: number; step: number; snap: boolean };

// svelte-ignore state_referenced_locally -- one-time seed, like React's useState(initialValue)
let internalIndex = $state(defaultIndex);
const count = $derived(items.length);
const index = $derived(
	count > 0 ? (((indexProp ?? internalIndex) % count) + count) % count : 0,
);
// svelte-ignore state_referenced_locally -- seeded once; later changes flow through the effect
let shown = $state<Shown>({ index, key: 0 });
let leaving = $state<Shown[]>([]);
// svelte-ignore state_referenced_locally -- seeded once; later changes flow through the effect
let roll = $state<Roll>({ index, step: index, snap: false });

$effect.pre(() => {
	if (shown.index === index) return;
	// Only the latest exit runs: queued ones would stack visibly after a backgrounded tab.
	leaving = [shown];
	shown = { index, key: shown.key + 1 };
});

$effect.pre(() => {
	if (roll.index === index) return;
	roll = { index, step: textLoopRollStep(roll.index, index, count), snap: false };
});

$effect(() => {
	if (indexProp !== undefined || count <= 1) return;
	const id = setInterval(() => {
		const next = (index + 1) % count;
		internalIndex = next;
		onIndexChange?.(next);
	}, intervalMs);
	return () => clearInterval(id);
});

// After landing on the duplicate first item, jump back to 0 with the transition off.
$effect(() => {
	if (!roll.snap) return;
	let frame = requestAnimationFrame(() => {
		frame = requestAnimationFrame(() => (roll = { ...roll, snap: false }));
	});
	return () => cancelAnimationFrame(frame);
});

const styles = $derived(textLoop({ variant, direction, size }));
const longest = $derived(items.reduce((a, b) => (b.length > a.length ? b : a), ""));
</script>

{#if count > 0}
	<span
		data-slot="text-loop"
		data-variant={variant}
		class={cn(styles.root(), className)}
		style:--text-loop-duration="{durationMs}ms"
		style:--text-loop-step={roll.step}
	>
		<span aria-hidden="true" class={styles.sizer()}>{longest}</span>
		{#if variant === "roll"}
			<span aria-hidden="true" class={styles.viewport()}>
				<span
					class={styles.stack()}
					data-snap={roll.snap ? "" : undefined}
					ontransitionend={() => {
						if (roll.step === count) roll = { ...roll, step: 0, snap: true };
					}}
				>
					{#each [...items, items[0]] as text, i (i)}
						<span class={styles.stackItem()}>{text}</span>
					{/each}
				</span>
			</span>
			<span class={styles.srOnly()}>{items[index]}</span>
		{:else}
			<span class={styles.viewport()}>
				{#each leaving as item (item.key)}
					<span
						aria-hidden="true"
						class={cn(styles.item(), "text-loop-exit")}
						onanimationend={() => (leaving = leaving.filter((l) => l.key !== item.key))}
						>{items[item.index]}</span
					>
				{/each}
				{#key shown.key}
					<span class={cn(styles.item(), shown.key > 0 && "text-loop-enter")}>{items[index]}</span>
				{/key}
			</span>
		{/if}
	</span>
{/if}
