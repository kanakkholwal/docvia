<script lang="ts">
import { page } from "$app/state";
import { nav } from "$lib/nav";
import { cn } from "$lib/utils";
</script>

<nav class="flex flex-col gap-7 py-6 text-sm">
	{#each nav as group}
		<div class="flex flex-col gap-2">
			<h4
				class="px-3 text-[11px] font-semibold uppercase tracking-widest text-muted"
			>
				{group.title}
			</h4>
			<ul class="flex flex-col gap-0.5">
				{#each group.items as item}
					{@const active = page.url.pathname === item.href}
					<li>
						{#if item.soon}
							<span
								class="flex items-center justify-between rounded-md px-3 py-1.5 text-muted-soft"
							>
								<span class="flex items-center gap-2">
									<span class="h-1.5 w-1.5 rounded-full bg-transparent"></span>
									{item.label}
								</span>
								<span
									class="rounded-full bg-surface-card px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted"
								>
									soon
								</span>
							</span>
						{:else}
							<a
								href={item.href}
								class={cn(
									"flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors duration-(--motion-fast)",
									active
										? "bg-surface-card font-medium text-ink"
										: "text-body hover:bg-surface-card/60 hover:text-ink",
								)}
							>
								{#if active}
									<span class="h-1.5 w-1.5 rounded-full bg-brand-coral"></span>
								{:else}
									<span class="h-1.5 w-1.5 rounded-full bg-transparent"></span>
								{/if}
								{item.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>
