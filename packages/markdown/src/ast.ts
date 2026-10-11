/** Attributes from a directive's `{...}`: `#id`, `.class` and `key=value` pairs. */
export type Attributes = Record<string, string>;

export type Block =
	| { type: "paragraph"; children: Inline[] }
	| {
			type: "heading";
			depth: 1 | 2 | 3 | 4 | 5 | 6;
			id: string;
			children: Inline[];
	  }
	| { type: "code"; lang: string; meta: string; value: string }
	| { type: "blockquote"; children: Block[] }
	| {
			type: "list";
			ordered: boolean;
			start: number;
			tight: boolean;
			children: ListItem[];
	  }
	| { type: "thematicBreak" }
	| {
			type: "table";
			align: Array<"left" | "right" | "center" | null>;
			head: Inline[][];
			rows: Inline[][][];
	  }
	| { type: "html"; value: string }
	/** `:::name{attrs}` ... `:::` (children) or `::name{attrs}` (none). */
	| {
			type: "directive";
			name: string;
			label: Inline[];
			attributes: Attributes;
			children: Block[];
	  };

export interface ListItem {
	type: "listItem";
	/** GFM task item state; `null` for a plain item. */
	checked: boolean | null;
	children: Block[];
}

export type Inline =
	| { type: "text"; value: string }
	| { type: "emphasis"; children: Inline[] }
	| { type: "strong"; children: Inline[] }
	| { type: "delete"; children: Inline[] }
	| { type: "code"; value: string }
	| { type: "link"; href: string; title: string; children: Inline[] }
	| { type: "image"; src: string; alt: string; title: string }
	| { type: "break" }
	| { type: "html"; value: string }
	/** `:name[label]{attrs}` inside a paragraph. */
	| {
			type: "directive";
			name: string;
			attributes: Attributes;
			children: Inline[];
	  };

export interface Root {
	type: "root";
	children: Block[];
}
