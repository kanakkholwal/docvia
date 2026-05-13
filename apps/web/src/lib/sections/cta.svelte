<script lang="ts">
import { ArrowRight, Github } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
</script>

<section class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 pb-24 md:px-10 md:pb-24">
		<div
			class="relative overflow-hidden rounded-xl bg-surface-soft px-8 py-16 md:px-16 md:py-20"
		>
			<!-- Decorative brand-color shapes (claymation stand-ins) -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-peach"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute -bottom-6 right-24 h-20 w-20 rounded-full bg-brand-pink"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute bottom-6 right-8 h-14 w-14 rounded-full bg-brand-ochre"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-brand-mint"
			></div>

			<div class="relative max-w-2xl">
				<h2
					class="font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
					style="letter-spacing: -0.03em;"
				>
					Turn your docs into a build artifact today.
				</h2>
				<p class="mt-6 max-w-xl text-lg leading-[1.55] text-body">
					Open source, MIT licensed, in public preview. Install it now, deploy
					anywhere, and help shape the v1.0 release.
				</p>
				<div class="mt-10 flex flex-col gap-3 sm:flex-row">
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
	</div>
</section>
