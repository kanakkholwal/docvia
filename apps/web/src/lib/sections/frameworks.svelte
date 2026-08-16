<script lang="ts">
import {
	siHtml5,
	siMarkdown,
	siNextdotjs,
	siReact,
	siSvelte,
	siTypescript,
	siVite,
} from "simple-icons";

// Honest span of the toolchain: docvia takes Markdown, is written in
// TypeScript, renders to React and Svelte, integrates with Next.js and Vite,
// and emits static HTML. Official brand marks (simple-icons), shown monochrome
// to stay within the one-accent palette.
const logos = [
	{ title: "Markdown", path: siMarkdown.path },
	{ title: "TypeScript", path: siTypescript.path },
	{ title: "React", path: siReact.path },
	{ title: "Svelte", path: siSvelte.path },
	{ title: "Next.js", path: siNextdotjs.path },
	{ title: "Vite", path: siVite.path },
	{ title: "HTML5", path: siHtml5.path },
];
</script>

<section class="border-b border-hairline bg-canvas">
	<div class="px-6 pt-14 pb-9 md:px-10">
		<p class="label-meta text-center">Markdown in. Your framework out.</p>
	</div>

	<div class="marquee pb-14" aria-hidden="true">
		<div class="marquee-track">
			{#each [...logos, ...logos] as logo}
				<span class="logo">
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0"
						fill="currentColor"
						role="img"
						aria-label={logo.title}
					>
						<path d={logo.path} />
					</svg>
					<span class="text-[15px] font-semibold">{logo.title}</span>
				</span>
			{/each}
		</div>
	</div>

	<!-- Static, screen-reader-friendly list of the same names -->
	<p class="sr-only">
		Works with Markdown, TypeScript, React, Svelte, Next.js, Vite, and static HTML.
	</p>
</section>

<style>
	.marquee {
		position: relative;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent,
			#000 8%,
			#000 92%,
			transparent
		);
		mask-image: linear-gradient(
			90deg,
			transparent,
			#000 8%,
			#000 92%,
			transparent
		);
	}
	.marquee-track {
		display: flex;
		width: max-content;
		gap: 3.5rem;
		padding-left: 3.5rem;
		animation: marquee 32s linear infinite;
	}
	.marquee:hover .marquee-track {
		animation-play-state: paused;
	}
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--muted);
		transition: color var(--motion-base) var(--ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.logo:hover {
			color: var(--ink);
		}
	}
	@keyframes marquee {
		to {
			/* Half the track is a duplicate, so -50% loops seamlessly. */
			transform: translateX(-50%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.marquee {
			overflow-x: auto;
		}
		.marquee-track {
			animation: none;
		}
	}
</style>
