<script lang="ts">
import { ArrowRight, Github } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
</script>

<!-- Quiet, centered close. The full-bleed colour band this replaced fought the
     "borders not fills" rule the rest of the page follows. -->
<section class="relative overflow-hidden bg-canvas">
	<div class="glow" aria-hidden="true"></div>

	<div
		class="relative mx-auto max-w-page px-5 py-24 text-center sm:px-10 md:py-32"
	>
		<h2
			class="mx-auto max-w-3xl font-display text-[40px] leading-[1.12] tracking-tighter text-ink md:text-[60px]"
		>
			Turn your docs into a build artifact.
		</h2>
		<p class="mx-auto mt-6 max-w-xl text-[18px] leading-7 text-body">
			Open source, MIT licensed, in public preview. Install it now, deploy
			anywhere, and help shape the v1.0 release.
		</p>
		<div class="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
			<Button href="/docs" class="cta-glow">
				Get started
				<ArrowRight />
			</Button>
			<Button
				variant="outline"
				href="https://github.com/kanakkholwal/docvia"
			>
				<Github />
				View on GitHub
			</Button>
		</div>
	</div>
</section>

<style>
	.glow {
		position: absolute;
		bottom: -45%;
		left: 50%;
		width: min(820px, 110%);
		height: 560px;
		transform: translateX(-50%);
		background: radial-gradient(
			50% 50% at 50% 50%,
			color-mix(in oklab, var(--brand-strong) 30%, transparent),
			transparent 70%
		);
		filter: blur(60px);
		opacity: 0.45;
		pointer-events: none;
	}
</style>
