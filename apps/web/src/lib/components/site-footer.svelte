<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import { version } from "$lib/version.svelte";
import { Github, MessageCircle, Package } from "@lucide/svelte";
</script>

<footer class="relative border-t border-hairline bg-surface-soft">
	<div class="mx-auto max-w-page border-x border-hairline px-5 pt-20 sm:px-10 md:pt-24">
		<!-- Brand + tagline + social (vite-style: no newsletter card) -->
		<div class="flex flex-col gap-5 border-b border-hairline pb-12">
			<Brand size="lg" />
			<p class="max-w-md text-[16px] leading-[1.6] text-body">
				The build-time documentation compiler. Open source,
				framework-agnostic, self-host anywhere.
			</p>
			<div class="flex items-center gap-2 pt-1">
				<a
					href="https://github.com/kanakkholwal/docvia"
					aria-label="GitHub"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<Github class="h-4 w-4" />
				</a>
				<a
					href="https://www.npmjs.com/org/docvia"
					aria-label="npm"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<Package class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/kanakkholwal/docvia/discussions"
					aria-label="Discussions"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<MessageCircle class="h-4 w-4" />
				</a>
			</div>
		</div>

		<!-- Mid: link columns -->
		<div class="grid gap-10 py-12 md:grid-cols-3 md:gap-8">
			<div>
				<div class="mb-4 flex items-center gap-2">
					<h4 class="label-meta">Product</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="/#features" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Features</a></li>
					<li><a href="/#how-it-works" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">How it works</a></li>
					<li><a href="/#quickstart" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Quickstart</a></li>
					<li><a href="/#faq" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">FAQ</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<h4 class="label-meta">Resources</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="/docs" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Documentation</a></li>
					<li><a href="/docs/getting-started" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Getting started</a></li>
					<li><a href="/docs/guide/configuration" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Config reference</a></li>
					<li><a href="/docs/packages/plugin-openapi" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">OpenAPI plugin</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/releases" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Changelog</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<h4 class="label-meta">Community</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="https://github.com/kanakkholwal/docvia" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">GitHub</a></li>
					<li><a href="https://www.npmjs.com/org/docvia" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">npm</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/issues" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Report an issue</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/discussions" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Discussions</a></li>
				</ul>
			</div>
		</div>

		<!-- Bottom row: copyright + version + made-with -->
		<div
			class="flex flex-col items-start gap-3 border-t border-hairline pt-6 pb-10 text-[13px] text-muted md:flex-row md:items-center md:justify-between"
		>
			<div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
				<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
			</div>
			<div class="flex items-center gap-3">
				<span class="inline-flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<span class="font-mono">v{version.current} preview</span>
				</span>
				<span class="text-muted-soft">·</span>
				<span>Built with docvia</span>
			</div>
		</div>
	</div>
</footer>
