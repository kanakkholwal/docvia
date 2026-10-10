const KEY = "docvia-api-sample";

function stored(): string | undefined {
	try {
		return localStorage.getItem(KEY) ?? undefined;
	} catch {
		return undefined;
	}
}

/** The reader's code sample language, shared by every sample block and remembered across pages. */
export const sampleLanguage = $state<{ id: string | undefined }>({
	id: undefined,
});

export function restoreSampleLanguage() {
	sampleLanguage.id ??= stored();
}

export function chooseSampleLanguage(id: string) {
	sampleLanguage.id = id;
	try {
		localStorage.setItem(KEY, id);
	} catch {
		// Private windows and blocked storage: the choice lasts for this page only.
	}
}
