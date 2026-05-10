<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowRight, Sparkles } from "@lucide/svelte";
</script>

<section class="relative overflow-hidden">
	<!-- Backdrop glow -->
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-subtle)_0%,transparent_70%)] opacity-80"
	></div>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0%,var(--bg)_70%)]"
	></div>
	<!-- Grid backdrop -->
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 -z-20 opacity-[0.05]"
		style="background-image: linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(to right, var(--fg) 1px, transparent 1px); background-size: 40px 40px;"
	></div>

	<div
		class="mx-auto max-w-[1200px] px-6 pt-20 pb-16 md:px-10 md:pt-32 md:pb-24"
	>
		<div class="mx-auto flex max-w-3xl flex-col items-center text-center">
			<Badge variant="accent" class="mb-6">
				<Sparkles class="h-3 w-3" />
				v0.1 preview · open source
			</Badge>

			<h1
				class="font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
			>
				The fastest way to ship
				<br class="hidden sm:block" />
				<span class="text-accent">developer documentation.</span>
			</h1>

			<p class="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl">
				docvia compiles your Markdown into typed, pre-rendered modules for
				React, Svelte, or any framework. Incremental builds, full-text
				search, and zero runtime parsing — all from a single config file.
			</p>

			<div class="mt-8 flex flex-col items-center gap-3 sm:flex-row">
				<Button size="lg" href="/docs">
					Start building
					<ArrowRight />
				</Button>
				<Button
					variant="outline"
					size="lg"
					href="https://github.com/kanakkholwal/docvia"
				>
					View on GitHub
				</Button>
			</div>

			<p class="mt-4 font-mono text-xs text-fg-subtle">
				$ pnpm add -D @docvia/cli
			</p>
		</div>

		<!-- Hero product preview: docs site mock -->
		<div class="relative mx-auto mt-20 max-w-5xl">
			<!-- Floating accent halos -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute -left-12 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute -right-12 bottom-12 h-40 w-40 rounded-full bg-info/10 blur-3xl"
			></div>

			<div
				class="overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-[var(--shadow-lg)]"
			>
				<!-- Window chrome -->
				<div
					class="flex items-center gap-2 border-b border-border bg-bg-muted/40 px-4 py-2.5"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<div
						class="ml-3 flex flex-1 items-center justify-center"
					>
						<span
							class="rounded-md bg-bg px-3 py-1 font-mono text-[11px] text-fg-subtle"
						>
							docs.example.com
						</span>
					</div>
				</div>

				<!-- Mock docs layout -->
				<div class="grid grid-cols-12">
					<!-- Sidebar -->
					<aside
						class="col-span-3 hidden border-r border-border bg-bg-subtle/40 p-4 md:block"
					>
						<div class="mb-3 flex items-center gap-2">
							<span
								class="grid h-5 w-5 place-items-center rounded bg-accent text-[10px] font-bold text-accent-fg"
							>d</span>
							<span class="text-xs font-semibold">Acme Docs</span>
						</div>
						<div class="space-y-3">
							{#each ["Introduction", "Quickstart", "Concepts", "Reference"] as group, i}
								<div>
									<div
										class="mb-1.5 px-2 text-[10px] uppercase tracking-[0.05em] text-fg-subtle"
									>
										{group}
									</div>
									<div class="space-y-0.5">
										{#each Array(3) as _, j}
											<div
												class={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${i === 0 && j === 1 ? "bg-bg-muted text-fg" : "text-fg-muted"}`}
											>
												{#if i === 0 && j === 1}
													<span class="h-1 w-1 rounded-full bg-accent"></span>
												{:else}
													<span class="h-1 w-1 rounded-full bg-transparent"></span>
												{/if}
												<span class="h-2 flex-1 rounded-sm bg-fg/10"></span>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</aside>

					<!-- Content -->
					<div class="col-span-12 p-6 md:col-span-9 md:p-8">
						<div class="text-[10px] font-medium uppercase tracking-[0.05em] text-accent">
							Quickstart
						</div>
						<div class="mt-2 h-7 w-3/4 rounded-md bg-fg/15"></div>
						<div class="mt-3 h-3 w-full rounded bg-fg/10"></div>
						<div class="mt-1.5 h-3 w-5/6 rounded bg-fg/10"></div>
						<div class="mt-1.5 h-3 w-4/6 rounded bg-fg/10"></div>

						<!-- Code block -->
						<div
							class="mt-6 overflow-hidden rounded-lg border border-border bg-bg"
						>
							<div
								class="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10px] text-fg-subtle"
							>
								<span class="font-mono">app.ts</span>
								<div class="flex items-center gap-2">
									<span class="h-1.5 w-1.5 rounded-full bg-success/60"></span>
									<span class="font-mono">typed</span>
								</div>
							</div>
							<div class="space-y-2 p-3">
								{#each [80, 60, 75, 45, 70, 55] as w}
									<div
										class="h-2 rounded bg-fg/10"
										style="width: {w}%"
									></div>
								{/each}
							</div>
						</div>

						<div class="mt-6 grid grid-cols-2 gap-3">
							<div
								class="rounded-md border border-border bg-bg p-3"
							>
								<div class="h-3 w-2/3 rounded bg-fg/15"></div>
								<div class="mt-2 h-2 w-full rounded bg-fg/10"></div>
								<div class="mt-1 h-2 w-3/4 rounded bg-fg/10"></div>
							</div>
							<div
								class="rounded-md border border-border bg-bg p-3"
							>
								<div class="h-3 w-2/3 rounded bg-fg/15"></div>
								<div class="mt-2 h-2 w-full rounded bg-fg/10"></div>
								<div class="mt-1 h-2 w-3/4 rounded bg-fg/10"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
