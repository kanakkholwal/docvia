// No top-level imports or exports here, or `declare module` turns into an augmentation and stops resolving.

declare module "virtual:docvia-snippets" {
	/** Shiki-rendered HTML per snippet, keyed by `SnippetName`. */
	export const highlighted: Record<string, string>;
}
