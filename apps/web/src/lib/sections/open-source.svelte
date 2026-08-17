<script lang="ts">
import { Github } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

const facts = [
	{
		title: "MIT licensed",
		body: "Every package in the workspace: compiler, CLI, renderers, plugins. Vendoring or shipping it commercially is fine.",
	},
	{
		title: "Developed in the open",
		body: "Issues, RFCs, and releases all happen on GitHub. Every version ships with a changeset describing what moved.",
	},
	{
		title: "Built to be contributed to",
		body: "A renderer adapter is a few hundred lines. If your framework is missing, the contract is small enough to add it yourself.",
	},
];
</script>

<section class="border-b border-hairline bg-surface-soft">
	<div class="mx-auto max-w-page px-5 py-14 text-center sm:px-10 sm:py-28">
		<span class="label-meta">Open source</span>
		<h2
			class="mx-auto mt-4 max-w-2xl font-display text-[32px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px] sm:leading-none"
		>
			Free, and free to leave.
		</h2>
		<p class="mx-auto mt-6 max-w-xl text-[18px] leading-7 text-body">
			docvia is a build tool you run yourself, so there is no account to create
			and nothing phoning home.
		</p>

		<div class="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
			<Button href="https://github.com/kanakkholwal/docvia" class="cta-glow">
				<Github />
				View on GitHub
			</Button>
			<Button
				variant="outline"
				href="https://github.com/kanakkholwal/docvia/blob/main/CONTRIBUTING.md"
			>
				Read the contributing guide
			</Button>
		</div>

		<div
			class="mt-16 grid gap-px border-y border-hairline bg-hairline text-left md:grid-cols-3"
		>
			{#each facts as fact}
				<div class="bg-canvas p-5 sm:p-8">
					<h3 class="text-[17px] font-medium leading-[1.22] text-ink">
						{fact.title}
					</h3>
					<p class="mt-2 text-[16px] leading-[1.56] text-body">{fact.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
