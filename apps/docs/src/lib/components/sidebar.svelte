<script lang="ts">
import { page } from "$app/state";
import { nav } from "$lib/nav";
import { cn } from "$lib/utils";
</script>

<nav class="flex flex-col gap-8 py-6 text-sm">
	{#each nav as group}
		<div class="flex flex-col gap-2">
			<h4
				class="px-3 text-xs font-medium uppercase tracking-[0.05em] text-fg-subtle"
			>
				{group.title}
			</h4>
			<ul class="flex flex-col gap-0.5">
				{#each group.items as item}
					{@const active = page.url.pathname === item.href}
					<li>
						{#if item.soon}
							<span
								class="flex items-center justify-between rounded-md px-3 py-1.5 text-fg-subtle/70"
							>
								<span class="flex items-center gap-2">
									<span class="h-1.5 w-1.5 rounded-full bg-transparent"></span>
									{item.label}
								</span>
								<span
									class="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-subtle/60"
								>
									soon
								</span>
							</span>
						{:else}
							<a
								href={item.href}
								class={cn(
									"flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors duration-[var(--motion-fast)]",
									active
										? "bg-bg-muted text-fg"
										: "text-fg-muted hover:bg-bg-muted/60 hover:text-fg",
								)}
							>
								{#if active}
									<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
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
