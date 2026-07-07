// Live package version, sourced from the npm registry so the docs stay current
// without a redeploy. SSR / no-JS render the fallback (kept equal to the
// current published latest); the client refreshes it on mount.
export const FALLBACK_VERSION = "0.3.0";

export const version = $state({ current: FALLBACK_VERSION });

let refreshed = false;

export async function refreshVersion(): Promise<void> {
	if (refreshed) return;
	refreshed = true;
	try {
		const res = await fetch("https://registry.npmjs.org/@docvia/cli/latest");
		if (!res.ok) return;
		const data = (await res.json()) as { version?: string };
		if (data.version) version.current = data.version;
	} catch {
		/* offline / rate-limited — keep the fallback */
	}
}
