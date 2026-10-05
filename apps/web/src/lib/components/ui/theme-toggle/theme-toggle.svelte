<script lang="ts">
import { flushSync } from "svelte";
import { cn } from "#lib/cn.js";
import { ensureRevealStyle, runThemeReveal, supportsViewTransition } from "./reveal";
import {
	type ThemeToggleStart,
	type ThemeToggleValue,
	type ThemeToggleVariant,
	themeToggle,
} from "./variants";

let {
	theme: themeProp,
	defaultTheme = "light",
	onThemeChange,
	variant = "rectangle",
	start = "bottom-up",
	class: classProp,
	iconClass,
}: {
	theme?: ThemeToggleValue;
	defaultTheme?: ThemeToggleValue;
	onThemeChange?: (theme: ThemeToggleValue) => void;
	variant?: ThemeToggleVariant;
	start?: ThemeToggleStart;
	class?: string;
	iconClass?: string;
} = $props();

// svelte-ignore state_referenced_locally -- intentional one-time seed, matching React's useState(initialValue)
let internalTheme = $state(defaultTheme);
const theme = $derived(themeProp ?? internalTheme);
const isDark = $derived(theme === "dark");

$effect(ensureRevealStyle);

function setTheme(next: ThemeToggleValue) {
	if (themeProp === undefined) internalTheme = next;
	onThemeChange?.(next);
}

function toggle() {
	const next: ThemeToggleValue = isDark ? "light" : "dark";
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (reduced || !supportsViewTransition()) {
		setTheme(next);
		return;
	}

	// The new snapshot is taken when the callback returns, so the DOM must already be updated.
	runThemeReveal(variant, start, () => flushSync(() => setTheme(next)));
}
</script>

<button
	type="button"
	data-slot="theme-toggle"
	aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
	onclick={toggle}
	class={cn(themeToggle({ variant, start }), classProp)}
>
	{#key theme}
		<span class="theme-toggle-icon">
			{#if isDark}
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class={iconClass}>
					<circle cx="8" cy="8" r="3.2" stroke="currentColor" stroke-width="1.4" />
					<path
						d="M8 1v1.4M8 13.6V15M15 8h-1.4M2.4 8H1M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
					/>
				</svg>
			{:else}
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class={iconClass}>
					<path
						d="M13.8 9.7A6 6 0 1 1 6.3 2.2a5 5 0 0 0 7.5 7.5Z"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</span>
	{/key}
</button>
