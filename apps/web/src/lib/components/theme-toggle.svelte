<script lang="ts">
	import { Moon, Sun } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { Button } from "./ui/button";

	let theme = $state<"light" | "dark">("dark");

	onMount(() => {
		const stored = localStorage.getItem("docvia-theme") as
			| "light"
			| "dark"
			| null;
		theme = stored ?? (document.documentElement.dataset.theme as "light" | "dark") ?? "dark";
	});

	function toggle() {
		theme = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("docvia-theme", theme);
	}
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggle}
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if theme === "dark"}
		<Sun />
	{:else}
		<Moon />
	{/if}
</Button>
