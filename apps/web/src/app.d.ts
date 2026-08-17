// See https://svelte.dev/docs/kit/types#app
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** Injected by vite.config.ts `define` from packages/cli/package.json. */
	const __DOCVIA_VERSION__: string;
}

export {};
