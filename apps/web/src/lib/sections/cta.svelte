<script lang="ts">
import Github from "#lib/components/icons/github.svelte";
import InstallCommand from "#lib/components/install-command.svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { ArrowRight } from "@lucide/svelte";

let field: HTMLElement;
function track(event: PointerEvent) {
	if (event.pointerType !== "mouse") return;
	const box = field.getBoundingClientRect();
	field.style.setProperty("--mx", `${event.clientX - box.left}px`);
	field.style.setProperty("--my", `${event.clientY - box.top}px`);
}
</script>

<section aria-labelledby="cta-title" class="rise rounded-2xl bg-well-rim p-1">
	<div
		bind:this={field}
		onpointermove={track}
		role="presentation"
		class="field relative overflow-hidden rounded-xl bg-well-body px-6 py-14 text-center shadow-surface ring-1 ring-ink/[0.04] sm:py-20"
	>
		<h2 id="cta-title" class="relative font-pixel text-3xl text-ink sm:text-5xl">ship docs with your app.</h2>
		<p class="relative mx-auto mt-4 max-w-md text-body">
			One command adds routes, search and a typed content source to the app you already have.
		</p>
		<div class="relative mx-auto mt-8 max-w-md text-left">
			<InstallCommand />
		</div>
		<div class="relative mt-6 flex flex-wrap justify-center gap-3">
			<Button href="/docs/getting-started" size="lg" class="group/roll">
				Get started
				<ArrowRight class="transition-transform duration-(--duration-fast) group-hover/roll:translate-x-0.5" />
			</Button>
			<Button href="https://github.com/kanakkholwal/docvia" variant="secondary" size="lg">
				<Github />
				Star on GitHub
			</Button>
		</div>
	</div>
</section>

<style>
	/* Same lit dot field as the hero, following the pointer across the panel. */
	.field::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image: radial-gradient(circle, var(--brand) 1px, transparent 1.5px);
		background-size: 14px 14px;
		mask-image: radial-gradient(260px circle at var(--mx, 50%) var(--my, 30%), #000, transparent 70%);
		opacity: 0.5;
		pointer-events: none;
	}
</style>
