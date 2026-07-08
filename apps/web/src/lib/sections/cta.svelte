<script lang="ts">
import { ArrowRight, Github } from "@lucide/svelte";
</script>

<section class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<!-- The one full-bleed brand band: lime fill, ink type. This is the
		     single large moment of accent on the whole page. -->
		<div
			class="relative overflow-hidden rounded-xl bg-brand px-8 py-16 text-on-brand md:px-16 md:py-20"
		>
			<div class="relative max-w-2xl">
				<h2
					class="font-display text-4xl md:text-5xl lg:text-display-2 lg:leading-[1.05]"
				>
					Turn your docs into a build artifact today.
				</h2>
				<p class="mt-6 max-w-xl text-lg leading-[1.55] text-on-brand/80">
					Open source, MIT licensed, in public preview. Install it now, deploy
					anywhere, and help shape the v1.0 release.
				</p>
				<div class="mt-10 flex flex-col gap-3 sm:flex-row">
					<a
						href="https://docs.docvia.dev"
						class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-6 text-base font-semibold text-on-primary transition-colors hover:bg-ink/90"
					>
						Read the docs
						<ArrowRight class="h-4 w-4" />
					</a>
					<a
						href="https://github.com/kanakkholwal/docvia"
						class="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-on-brand/25 px-6 text-base font-semibold text-on-brand transition-colors hover:bg-on-brand/10"
					>
						<Github class="h-4 w-4" />
						Star on GitHub
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
