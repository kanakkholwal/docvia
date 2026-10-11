<script lang="ts">
import { SITE } from "#lib/seo.ts";
import Seo from "#lib/components/site/seo.svelte";
import Hero from "#lib/sections/hero.svelte";
import HowItWorks from "#lib/sections/how-it-works.svelte";
import Cta from "#lib/sections/cta.svelte";
import Faq from "#lib/sections/faq.svelte";
import Numbers from "#lib/sections/numbers.svelte";
import Packages from "#lib/sections/packages.svelte";
import Quickstart from "#lib/sections/quickstart.svelte";
import Renderers from "#lib/sections/renderers.svelte";
import Statement from "#lib/sections/statement.svelte";
import Workers from "#lib/sections/workers.svelte";
</script>

<Seo
	title="docvia · {SITE.tagline}"
	schema={[
		{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, description: SITE.description },
		{
			"@context": "https://schema.org",
			"@type": "SoftwareSourceCode",
			name: SITE.name,
			description: SITE.description,
			url: SITE.url,
			codeRepository: SITE.repo,
			programmingLanguage: "TypeScript",
			license: "https://opensource.org/licenses/MIT",
		},
	]}
/>

<Hero />

<div class="mx-auto flex max-w-page flex-col gap-24 px-5 py-20 sm:px-10 sm:py-24 lg:px-16">
	<Statement />
	<HowItWorks />
	<Renderers />
	<Numbers />
	<Quickstart />
	<Workers />
	<Packages />
	<Faq />
	<Cta />
</div>
