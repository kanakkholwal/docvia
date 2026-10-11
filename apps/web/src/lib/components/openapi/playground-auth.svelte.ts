/**
 * Credentials typed into the playground, by security scheme name. Shared across API pages for
 * the visit and never written to storage, so a token does not outlive the tab.
 */
export const playgroundAuth = $state<Record<string, string>>({});
