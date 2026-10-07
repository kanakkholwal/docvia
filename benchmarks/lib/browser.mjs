import { waitFor } from "./process.mjs";

let launched;

/** Headless Chromium, started on first use and shared by every client-rendered stack. */
async function browser() {
	launched ??= import("playwright").then(({ chromium }) => chromium.launch());
	return launched;
}

export async function closeBrowser() {
	if (!launched) return;
	const instance = await launched;
	launched = undefined;
	await instance.close();
}

export async function newPage() {
	return (await browser()).newPage();
}

const rendered = (page, text) =>
	page.evaluate((t) => document.body?.innerText.includes(t) ?? false, text);

/**
 * Resolves with the ms until `text` is rendered at `url`. Without `reload` it navigates once and
 * then watches the open page, so hot updates count; with it, each attempt reloads the URL.
 */
export function browserSees(
	page,
	url,
	text,
	{ label, timeoutMs, reload = false },
) {
	return waitFor(
		async () => {
			try {
				if (reload || page.url() !== url) {
					await page.goto(url, {
						waitUntil: "domcontentloaded",
						timeout: 15_000,
					});
					// Client-rendered pages fill in after load; checking at once would always miss.
					return await page
						.waitForFunction(
							(t) => document.body?.innerText.includes(t) ?? false,
							text,
							{ timeout: 5_000 },
						)
						.then(
							() => true,
							() => false,
						);
				}
				return await rendered(page, text);
			} catch {
				return false;
			}
		},
		{ label, timeoutMs },
	);
}
