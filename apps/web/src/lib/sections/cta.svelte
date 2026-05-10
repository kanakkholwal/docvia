<script lang="ts">
import { ArrowRight, Github } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
</script>

<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10">
		<div
			class="relative overflow-hidden rounded-2xl border border-accent/30 bg-bg-subtle px-8 py-16 text-center md:px-16"
		>
			<!-- Backdrop glow -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,var(--accent-subtle)_0%,transparent_70%)] opacity-80"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 -z-20 opacity-[0.04]"
				style="background-image: linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(to right, var(--fg) 1px, transparent 1px); background-size: 32px 32px;"
			></div>

			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Compile your first build.
			</h2>
			<p class="mx-auto mt-3 max-w-xl text-fg-muted">
				docvia is open source and in public preview. Install today, file
				issues, and help shape the v1.0 release.
			</p>
			<div
				class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
			>
				<Button size="lg" href="/docs">
					Read the docs
					<ArrowRight />
				</Button>
				<Button
					variant="outline"
					size="lg"
					href="https://github.com/kanakkholwal/docvia"
				>
					<Github />
					Star on GitHub
				</Button>
			</div>
		</div>
	</div>
</section>
