<script lang="ts">
import Brand from "$lib/components/brand.svelte";

const columns = [
	{
		heading: "Product",
		links: [
			{ label: "Features", href: "/#features" },
			{ label: "How it works", href: "/#how-it-works" },
			{ label: "Quickstart", href: "/#quickstart" },
			{ label: "FAQ", href: "/#faq" },
		],
	},
	{
		heading: "Resources",
		links: [
			{ label: "Documentation", href: "/docs" },
			{ label: "Getting started", href: "/docs/getting-started" },
			{ label: "Config reference", href: "/docs/guide/configuration" },
			{ label: "Plugins", href: "/docs/packages/plugins" },
			{ label: "Changelog", href: "https://github.com/kanakkholwal/docvia/releases" },
		],
	},
	{
		heading: "Community",
		links: [
			{ label: "GitHub", href: "https://github.com/kanakkholwal/docvia" },
			{ label: "npm", href: "https://www.npmjs.com/org/docvia" },
			{ label: "Report an issue", href: "https://github.com/kanakkholwal/docvia/issues" },
			{ label: "Discussions", href: "https://github.com/kanakkholwal/docvia/discussions" },
		],
	},
];
</script>

<footer class="relative border-t border-hairline bg-surface-soft">
	<div class="mx-auto max-w-page border-x border-hairline px-5 pt-20 sm:px-10 md:pt-24">
		<!-- Brand + tagline. The social icon row that used to sit here linked to
		     GitHub, npm and Discussions — the same three destinations, in the same
		     order, as the Community column below it. -->
		<div class="flex flex-col gap-5 border-b border-hairline pb-12">
			<Brand size="lg" />
			<p class="max-w-md text-[16px] leading-[1.6] text-body">
				The build-time documentation compiler. Open source,
				framework-agnostic, self-host anywhere.
			</p>
		</div>

		<div class="grid gap-10 py-12 md:grid-cols-3 md:gap-8">
			{#each columns as column (column.heading)}
				<div>
					<h4 class="label-meta mb-4">{column.heading}</h4>
					<ul class="space-y-2.5 text-[15px]">
						{#each column.links as link (link.href)}
							<li>
								<a
									href={link.href}
									class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="border-t border-hairline pt-6 pb-10 text-[13px] text-muted">
			<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
		</div>
	</div>
</footer>
