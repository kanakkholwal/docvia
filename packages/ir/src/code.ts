import type { IRNode } from "./index";

export interface FenceMeta {
	/** Caption shown above the block: `title="vite.config.ts"`. */
	readonly title?: string;
	/** Tab label; adjacent fences with a `tab` become one code group. */
	readonly tab?: string;
	/** Every attribute, flags as `true`. */
	readonly attributes: Readonly<Record<string, string | true>>;
}

const ATTRIBUTE = /(?<=^|\s)([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

/** Parse a fence's info string after the language: ```ts title="a.ts" tab="React" */
export function parseFenceMeta(meta: string | undefined): FenceMeta {
	const attributes: Record<string, string | true> = {};
	for (const m of (meta ?? "").matchAll(ATTRIBUTE)) {
		const name = m[1] as string;
		attributes[name] = m[2] ?? m[3] ?? m[4] ?? true;
	}
	const str = (v: string | true | undefined) =>
		typeof v === "string" ? v : undefined;
	return {
		title: str(attributes.title),
		tab: str(attributes.tab),
		attributes,
	};
}

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** Languages whose fences expand into one tab per package manager. */
export const PACKAGE_MANAGER_LANGS = new Set(["npm", "package-install"]);

const DEV_FLAGS = new Set(["-D", "--save-dev"]);

function convertLine(line: string, pm: PackageManager): string {
	const words = line.trim().split(/\s+/);
	const [bin, cmd, ...rest] = words;
	if (pm === "npm" || !bin) return line;
	if (bin === "npx") {
		const tail = words.slice(1).join(" ");
		return pm === "bun" ? `bunx ${tail}` : `${pm} dlx ${tail}`;
	}
	if (bin !== "npm") return line;
	if (cmd === "install" || cmd === "i" || cmd === "add") {
		if (rest.length === 0) return `${pm} install`;
		const dev = rest.some((w) => DEV_FLAGS.has(w));
		const global = rest.some((w) => w === "-g" || w === "--global");
		const pkgs = rest.filter(
			(w) => !DEV_FLAGS.has(w) && w !== "-g" && w !== "--global",
		);
		if (global) {
			return pm === "yarn"
				? `yarn global add ${pkgs.join(" ")}`
				: `${pm} add -g ${pkgs.join(" ")}`;
		}
		return [pm, "add", ...(dev ? ["-D"] : []), ...pkgs].join(" ");
	}
	if (cmd === "run")
		return [pm === "yarn" ? "yarn" : `${pm} run`, ...rest].join(" ");
	if (cmd === "create" || cmd === "exec") return [pm, cmd, ...rest].join(" ");
	return line;
}

/** Rewrite npm commands (`npm i`, `npx`, `npm run`, `npm create`) for another package manager. */
export function convertNpmCommand(code: string, pm: PackageManager): string {
	return code
		.split("\n")
		.map((line) => convertLine(line, pm))
		.join("\n");
}

/** Bare package names (```npm\n@docvia/cli) mean "install this". */
export function normalizeInstallCommand(code: string): string {
	return code
		.split("\n")
		.map((line) =>
			/^\s*(npm|npx)\s/.test(line) || line.trim() === ""
				? line
				: `npm install ${line.trim()}`,
		)
		.join("\n");
}

const isTab = (n: IRNode): boolean =>
	n.type === "code-block" && typeof n.props.tab === "string";

/** Wrap each run of adjacent `tab=` code blocks in a `code-group` node. */
export function groupCodeTabs(
	nodes: readonly IRNode[],
	nextId: () => string,
): IRNode[] {
	const out: IRNode[] = [];
	let run: IRNode[] = [];
	const flush = () => {
		if (run.length === 0) return;
		out.push(codeGroup(run, nextId()));
		run = [];
	};
	for (const node of nodes) {
		if (isTab(node)) {
			run.push(node);
			continue;
		}
		// Blank text between fences doesn't break a group.
		if (
			run.length > 0 &&
			node.type === "text" &&
			String(node.props.value).trim() === ""
		) {
			continue;
		}
		flush();
		out.push(node);
	}
	flush();
	return out;
}

/** A `code-group` node; tab labels fall back to title, then language. */
export function codeGroup(blocks: readonly IRNode[], id: string): IRNode {
	const tabs = blocks.map(
		(b, i) =>
			String(b.props.tab ?? b.props.title ?? b.props.lang ?? "") ||
			`Tab ${i + 1}`,
	);
	return { type: "code-group", id, props: { tabs }, children: blocks };
}
