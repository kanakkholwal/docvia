<script lang="ts">
import CodeSample from "#lib/components/code-sample.svelte";
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import { siReact, siSvelte } from "simple-icons";
</script>

<Section id="renderers" number={2} title="bring your framework." description="One compiled tree, rendered by React or Svelte. The adapter contract is small enough to write your own.">
	<div class="grid gap-3 lg:grid-cols-2">
		<BentoCard title="React" description="@docvia/renderer-react" bodyClass="p-0">
			{#snippet icon()}
				<svg viewBox="0 0 24 24" class="size-6 fill-current" aria-hidden="true"><path d={siReact.path} /></svg>
			{/snippet}
			{#snippet children()}
				<CodeSample name="page.tsx" filename="app/docs/[[...slug]]/page.tsx" class="border-0" />
			{/snippet}
		</BentoCard>
		<BentoCard title="Svelte" description="@docvia/renderer-svelte" bodyClass="p-0">
			{#snippet icon()}
				<svg viewBox="0 0 24 24" class="size-6 fill-current" aria-hidden="true"><path d={siSvelte.path} /></svg>
			{/snippet}
			{#snippet children()}
				<CodeSample name="page.svelte" filename="src/routes/docs/[...slug]/+page.svelte" class="border-0" />
			{/snippet}
		</BentoCard>
	</div>
</Section>
