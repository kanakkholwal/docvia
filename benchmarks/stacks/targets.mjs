import { installApproved } from "../lib/setup.mjs";

/**
 * Next.js on Workers through OpenNext, set up with its own `migrate` command. Run with npx as its
 * docs do: `pnpm dlx` skips peer dependencies, and `migrate` imports its esbuild peer.
 */
export const openNext = {
	async setup({ app, capture, pins }) {
		// `migrate` installs the adapter itself, so pnpm's build approval can stop it like an install.
		await installApproved(
			capture,
			app,
			`npx --yes @opennextjs/cloudflare@${pins["@opennextjs/cloudflare"]} migrate`,
		);
	},
	build: "pnpm exec opennextjs-cloudflare build",
	platformIssues: {
		win32:
			"OpenNext's build cannot read pnpm's symlinked packages on Windows (Access is denied); measured on Linux",
	},
};

/** Nitro-based apps (TanStack Start, Nuxt) built with Nitro's Cloudflare Workers preset. */
export function nitroCloudflare(build) {
	return {
		build,
		env: { NITRO_PRESET: "cloudflare_module" },
		config: ".output/server/wrangler.json",
		pinCompatibilityDate: true,
	};
}
