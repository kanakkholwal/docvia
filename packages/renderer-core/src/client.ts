let installed = false;

function select(tab: Element): void {
	const group = tab.closest("[data-docvia-code-group]");
	if (!group) return;
	const index = tab.getAttribute("data-tab");
	for (const t of group.querySelectorAll(
		':scope > [role="tablist"] > [role="tab"]',
	)) {
		t.setAttribute("aria-selected", String(t === tab));
	}
	for (const panel of group.querySelectorAll<HTMLElement>(
		':scope > [role="tabpanel"]',
	)) {
		panel.hidden = panel.getAttribute("data-tab") !== index;
	}
}

/** Make rendered code groups switch tabs. One delegated listener; safe to call repeatedly. */
export function installCodeGroups(): void {
	if (installed || typeof document === "undefined") return;
	installed = true;
	document.addEventListener("click", (event) => {
		const tab = (event.target as Element | null)?.closest?.(
			'[data-docvia-code-group] > [role="tablist"] > [role="tab"]',
		);
		if (tab) select(tab);
	});
}

let copyInstalled = false;

/** Make the copy button on every code block work. One delegated listener; safe to call repeatedly. */
export function installCopyButtons(): void {
	if (copyInstalled || typeof document === "undefined") return;
	copyInstalled = true;
	document.addEventListener("click", async (event) => {
		const button = (event.target as Element | null)?.closest?.<HTMLElement>("[data-docvia-copy]");
		const code = button?.closest("[data-docvia-code]")?.querySelector("code");
		if (!button || !code) return;
		try {
			await navigator.clipboard.writeText(code.textContent ?? "");
		} catch {
			return;
		}
		button.dataset.copied = "";
		button.textContent = "Copied";
		setTimeout(() => {
			delete button.dataset.copied;
			button.textContent = "Copy";
		}, 1600);
	});
}
