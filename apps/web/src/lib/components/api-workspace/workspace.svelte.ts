import type {
	ApiOperation,
	FailedRequest,
	SentResponse,
} from "@docvia/plugin-openapi/source";

export type TabRef =
	| { kind: "operation"; slug: string }
	| { kind: "draft"; id: string };

/** One editable key/value line: a header, query or path parameter. */
export interface Row {
	id: string;
	enabled: boolean;
	name: string;
	value: string;
	/** Declared by the spec: the name is fixed and the row cannot be removed. */
	fixed?: boolean;
	required?: boolean;
	/** Display type from the spec, shown as the value's placeholder. */
	hint?: string;
}

export interface RequestState {
	method: string;
	/** Drafts: the full URL. Operations: the chosen server. */
	url: string;
	path: Row[];
	query: Row[];
	headers: Row[];
	body: string;
	contentType: string;
	/** Index of the chosen security alternative. */
	auth: string;
}

export interface Draft {
	id: string;
	name: string;
	request: RequestState;
}

export interface HistoryEntry {
	id: string;
	key: string;
	at: number;
	method: string;
	url: string;
	result: SentResponse | FailedRequest;
	request: RequestState;
}

export type Result = SentResponse | FailedRequest;

const STORAGE_KEY = "docvia-api-workspace";
const HISTORY_LIMIT = 50;
const HISTORY_BODY_LIMIT = 20_000;

export const tabKey = (tab: TabRef) =>
	tab.kind === "operation" ? `op:${tab.slug}` : `draft:${tab.id}`;

export const newId = () => crypto.randomUUID().slice(0, 8);

export const row = (partial: Partial<Row> = {}): Row => ({
	id: newId(),
	enabled: true,
	name: "",
	value: "",
	...partial,
});

const literal = (value: string | undefined) =>
	value?.startsWith('"') ? (JSON.parse(value) as string) : value;

/** A request prefilled from the spec: examples, required parameters and the first body example. */
export function requestFor(op: ApiOperation, server: string): RequestState {
	const params = (location: string) =>
		op.parameters
			.filter((p) => p.in === location)
			.map((p) => {
				const value =
					p.example ?? (p.required ? (literal(p.schema.default) ?? "") : "");
				return row({
					name: p.name,
					value:
						p.required && !value && p.schema.type === "string<uuid>"
							? crypto.randomUUID()
							: value,
					enabled: p.required || value !== "",
					fixed: true,
					required: p.required,
					hint: p.schema.type,
				});
			});
	const content = op.requestBody?.contents[0];
	return {
		method: op.method,
		url: server,
		path: params("path"),
		query: params("query"),
		headers: [
			...params("header"),
			row({ name: "Accept", value: "application/json" }),
		],
		body: content?.examples[0]?.code ?? "",
		contentType: content?.mediaType ?? "",
		auth: "0",
	};
}

export function blankDraft(): Draft {
	return {
		id: newId(),
		name: "Untitled request",
		request: {
			method: "GET",
			url: "",
			path: [],
			query: [row()],
			headers: [row({ name: "Accept", value: "*/*" })],
			body: "",
			contentType: "application/json",
			auth: "0",
		},
	};
}

/** Open tabs, drafts and history persist in this browser; credentials never do. */
class Workspace {
	tabs = $state<TabRef[]>([]);
	drafts = $state<Draft[]>([]);
	history = $state<HistoryEntry[]>([]);
	requests = $state<Record<string, RequestState>>({});
	results = $state<Record<string, Result | undefined>>({});
	activeDraft = $state<string>();
	loaded = false;

	load() {
		if (this.loaded) return;
		this.loaded = true;
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
			this.tabs = Array.isArray(saved.tabs) ? saved.tabs : [];
			this.drafts = Array.isArray(saved.drafts) ? saved.drafts : [];
			this.history = Array.isArray(saved.history) ? saved.history : [];
		} catch {
			// Blocked or corrupt storage: start empty.
		}
	}

	save() {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					tabs: this.tabs,
					drafts: this.drafts,
					history: this.history,
				}),
			);
		} catch {
			// Private windows and full storage: keep working for this visit.
		}
	}

	open(tab: TabRef) {
		const key = tabKey(tab);
		if (!this.tabs.some((t) => tabKey(t) === key)) this.tabs.push(tab);
		if (tab.kind === "draft") this.activeDraft = tab.id;
		this.save();
	}

	/** Closes a tab and returns the neighbour to show, if it was the active one. */
	close(tab: TabRef): TabRef | undefined {
		const key = tabKey(tab);
		const index = this.tabs.findIndex((t) => tabKey(t) === key);
		if (index === -1) return undefined;
		this.tabs.splice(index, 1);
		this.save();
		return this.tabs[index] ?? this.tabs[index - 1];
	}

	addDraft(): Draft {
		this.drafts.push(blankDraft());
		// The array holds a state proxy of the draft; edits must reach that copy to be saved.
		const draft = this.drafts.at(-1) as Draft;
		this.open({ kind: "draft", id: draft.id });
		return draft;
	}

	removeDraft(id: string) {
		this.drafts = this.drafts.filter((d) => d.id !== id);
		this.tabs = this.tabs.filter((t) => !(t.kind === "draft" && t.id === id));
		this.history = this.history.filter((h) => h.key !== `draft:${id}`);
		this.save();
	}

	record(
		key: string,
		request: RequestState,
		method: string,
		url: string,
		result: Result,
	) {
		this.results[key] = result;
		// Stored bodies are capped so fifty entries stay well inside localStorage's quota.
		const stored =
			"body" in result && result.body.length > HISTORY_BODY_LIMIT
				? {
						...result,
						body: `${result.body.slice(0, HISTORY_BODY_LIMIT)}\n… truncated in history`,
					}
				: result;
		this.history.unshift({
			id: newId(),
			key,
			at: Date.now(),
			method,
			url,
			result: stored,
			request: $state.snapshot(request),
		});
		this.history = this.history.slice(0, HISTORY_LIMIT);
		this.save();
	}
}

export const workspace = new Workspace();
