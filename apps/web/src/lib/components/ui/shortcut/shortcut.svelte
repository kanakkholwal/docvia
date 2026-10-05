<script lang="ts">
import { cn } from "#lib/cn.js";
import {
	isApplePlatform,
	joinCaps,
	matchesShortcut,
	parseShortcut,
	shortcutBlocked,
	shortcutOwner,
} from "#lib/shortcut-keys.js";
import { type ShortcutSize, type ShortcutVariant, shortcutCap } from "./variants";

let {
	shortcut,
	size = "md",
	variant = "default",
	joined = false,
	ontrigger,
	class: classProp,
}: {
	/** Tokens joined by `+`, e.g. `"mod+k"` (⌘ on Apple, Ctrl elsewhere) or `"shift+enter"`. */
	shortcut: string;
	size?: ShortcutSize;
	variant?: ShortcutVariant;
	/** One cap: glyphs run together (⇧⌘K), word keys take a `+` (Ctrl+K). */
	joined?: boolean;
	/** Runs on the key combo. Without it, the enclosing button or link is clicked. */
	ontrigger?: (event: KeyboardEvent) => void;
	class?: string;
} = $props();

let el = $state<HTMLElement>();
// Apple glyphs on the server and first paint; the platform is only known in the browser.
let apple = $state(true);
$effect(() => {
	apple = isApplePlatform();
});
const parsed = $derived(parseShortcut(shortcut, apple));
const caps = $derived.by(() => {
	const all = parsed?.caps ?? [shortcut];
	return joined ? [joinCaps(all)] : all;
});

$effect(() => {
	const combo = parsed;
	if (!combo) return;
	const onKey = (event: KeyboardEvent) => {
		if (event.repeat || !matchesShortcut(event, combo) || shortcutBlocked(event, combo))
			return;
		const owner = ontrigger ? undefined : el && shortcutOwner(el);
		if (!ontrigger && !owner) return;
		event.preventDefault();
		if (ontrigger) ontrigger(event);
		else owner?.click();
	};
	window.addEventListener("keydown", onKey);
	return () => window.removeEventListener("keydown", onKey);
});
</script>

<span bind:this={el} data-slot="shortcut" class={cn("inline-flex items-center gap-1", classProp)}>
	<span class="sr-only">{parsed?.spoken ?? shortcut}</span>
	{#each caps as cap, i (i)}
		<kbd aria-hidden="true" class={shortcutCap({ variant, size })}>
			{cap}
		</kbd>
	{/each}
</span>
