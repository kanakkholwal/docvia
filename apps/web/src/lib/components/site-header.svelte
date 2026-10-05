<script lang="ts">
import { afterNavigate } from "$app/navigation";
import { page } from "$app/state";
import Brand from "#lib/components/brand.svelte";
import SearchDialog from "#lib/components/docs/search-dialog.svelte";
import Github from "#lib/components/icons/github.svelte";
import IconRoll from "#lib/components/site/icon-roll.svelte";
import { RollText } from "#lib/components/text/roll-text/index.ts";
import ThemeToggle from "#lib/components/theme-toggle.svelte";
import { Menu, X } from "@lucide/svelte";
import type { Snippet } from "svelte";

type Props = {
	/** Replaces the default mobile link list, e.g. the docs sidebar. */
	mobileNav?: Snippet<[close: () => void]>;
};

let { mobileNav }: Props = $props();
let mobileOpen = $state(false);

const links = [
	{ label: "Docs", href: "/docs/getting-started" },
	{ label: "Packages", href: "/docs/packages" },
	{ label: "Changelog", href: "https://github.com/kanakkholwal/docvia/releases" },
];

const segments = $derived(page.url.pathname.split("/").filter(Boolean));
const close = () => (mobileOpen = false);
afterNavigate(close);
const ICON_BUTTON =
	"group/roll inline-flex size-9 items-center justify-center rounded-lg text-muted transition-[color,background-color,scale] duration-(--duration-fast) hover:bg-ink/[0.06] hover:text-ink active:scale-(--press-scale-icon)";
</script>

<header class="site-header sticky top-0 z-40 border-b border-dashed border-hairline-strong bg-canvas/85 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-5 sm:px-10 lg:px-16">
		<div class="flex min-w-0 items-center gap-5">
			<Brand size="sm" />
			<nav aria-label="Breadcrumb" class="hidden min-w-0 font-mono text-xs text-muted sm:block">
				<ol class="flex items-center gap-1.5">
					<li><a href="/" class="transition-colors hover:text-ink">~</a></li>
					{#each segments as seg, i}
						{@const href = `/${segments.slice(0, i + 1).join("/")}`}
						<li class="flex min-w-0 items-center gap-1.5">
							<span aria-hidden="true">/</span>
							{#if i === segments.length - 1}
								<span aria-current="page" class="truncate text-ink">{decodeURIComponent(seg)}</span>
							{:else}
								<a {href} class="truncate transition-colors hover:text-ink">{decodeURIComponent(seg)}</a>
							{/if}
						</li>
					{/each}
				</ol>
			</nav>
		</div>

		<div class="flex items-center gap-1">
			<nav class="mr-1 hidden items-center gap-0.5 md:flex">
				{#each links as link}
					<a
						href={link.href}
						class="group/roll rounded-lg px-2.5 py-1.5 text-sm text-muted transition-[color,background-color] duration-(--duration-fast) hover:bg-ink/[0.06] hover:text-ink"
					>
						<RollText text={link.label} groupHover size="sm" />
					</a>
				{/each}
			</nav>
			<SearchDialog />
			<span aria-hidden="true" class="mx-2 hidden h-4 w-px bg-hairline-strong sm:block"></span>
			<a href="https://github.com/kanakkholwal/docvia" aria-label="docvia on GitHub" class={ICON_BUTTON}>
				<IconRoll icon={Github} class="size-4" />
			</a>
			<ThemeToggle />
			<button
				aria-label="Toggle menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="{ICON_BUTTON} lg:hidden"
			>
				{#if mobileOpen}<X class="size-5" />{:else}<Menu class="size-5" />{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="max-h-[75vh] overflow-y-auto border-t border-dashed border-hairline-strong px-5 py-3 lg:hidden">
			{#if mobileNav}
				{@render mobileNav(close)}
			{:else}
				<nav class="flex flex-col">
					{#each links as link}
						<a href={link.href} onclick={close} class="flex min-h-11 items-center rounded-lg px-3 text-base text-body hover:bg-ink/[0.06] hover:text-ink">
							{link.label}
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	{/if}
</header>
