<script lang="ts">
import { GitPullRequest, Github, Scale } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

const facts = [
	{
		icon: Scale,
		title: "MIT licensed",
		body: "Every package in the workspace: compiler, CLI, renderers, plugins. Fork it, vendor it, ship it commercially.",
	},
	{
		icon: Github,
		title: "Developed in the open",
		body: "Issues, RFCs, and releases all happen on GitHub. Every version ships with a changeset describing what moved.",
	},
	{
		icon: GitPullRequest,
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
			docvia is a build tool you run yourself. There is no account, no metering,
			and no telemetry calling home.
		</p>

		<div class="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
			<Button href="https://github.com/kanakkholwal/docvia" class="cta-glow">
				<Github />
				Star on GitHub
			</Button>
			<Button
				variant="outline"
				href="https://github.com/kanakkholwal/docvia/blob/main/CONTRIBUTING.md"
			>
				Read the contributing guide
			</Button>
		</div>

		<div class="mt-16 grid gap-4 text-left md:grid-cols-3">
			{#each facts as fact}
				<div class="rounded-md border border-hairline bg-canvas p-6">
					<div
						class="grid h-10 w-10 place-items-center rounded-md border border-hairline bg-surface-soft text-brand-ink"
					>
						<fact.icon class="h-5 w-5" />
					</div>
					<h3 class="mt-4 text-[17px] font-medium leading-[1.22] text-ink">
						{fact.title}
					</h3>
					<p class="mt-2 text-[15px] leading-[1.6] text-body">{fact.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
