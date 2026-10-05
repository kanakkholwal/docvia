<script lang="ts">
import { ThemeToggle } from "#lib/components/ui/theme-toggle/index.ts";
import { onMount } from "svelte";

type Theme = "light" | "dark";
let theme = $state<Theme>("dark");

onMount(() => {
	theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
});

function apply(next: Theme) {
	theme = next;
	document.documentElement.dataset.theme = next;
	try {
		localStorage.setItem("docvia-theme", next);
	} catch {}
}
</script>

<ThemeToggle {theme} onThemeChange={apply} variant="circle" start="top-right" iconClass="size-4" class="size-9 rounded-lg text-muted transition-[color,background-color] duration-(--duration-fast) hover:bg-ink/[0.06] hover:text-ink" />
