import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { DEFAULT_PM, detectPackageManager, type PackageManager } from "../pm";

export type Framework = "next" | "sveltekit" | "tanstack-start" | "standalone";

export const FRAMEWORK_LABEL: Record<Framework, string> = {
	next: "Next.js",
	sveltekit: "SvelteKit",
	"tanstack-start": "TanStack Start",
	standalone: "Standalone (no framework)",
};

export interface Project {
	readonly root: string;
	readonly framework: Framework;
	readonly pm: PackageManager;
	/** Where the package manager was inferred from, for the summary line. */
	readonly pmSource:
		| "flag"
		| "lockfile"
		| "packageManager"
		| "user agent"
		| "default";
	/** Directory holding `lib/` and `components/`, relative to root (`src` or ``). */
	readonly srcDir: string;
	/** Directory holding routes, relative to root. */
	readonly routesDir: string;
	readonly dependencies: ReadonlySet<string>;
	readonly aliases: readonly Alias[];
	/** SvelteKit before 3 aliases `src/lib` as `$lib`; Kit 3 dropped it for package.json `imports`. */
	readonly dollarLib?: boolean;
}

/** An import prefix that maps to a directory, from tsconfig `paths` or package.json `imports`. */
export interface Alias {
	readonly prefix: string;
	readonly dir: string;
	/** Package `imports` resolve exact files, so specifiers need the extension. */
	readonly withExtension: boolean;
}

const LOCKFILES: Array<[string, PackageManager]> = [
	["pnpm-lock.yaml", "pnpm"],
	["bun.lock", "bun"],
	["bun.lockb", "bun"],
	["yarn.lock", "yarn"],
	["package-lock.json", "npm"],
];

function readJson(file: string): Record<string, unknown> | undefined {
	if (!existsSync(file)) return undefined;
	const text = readFileSync(file, "utf8")
		// tsconfig is JSONC: drop comments and trailing commas.
		.replace(
			/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
			(_, str) => str ?? "",
		)
		.replace(/,(\s*[}\]])/g, "$1");
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}

function detectPm(
	root: string,
	pkg: Record<string, unknown> | undefined,
): Pick<Project, "pm" | "pmSource"> {
	for (const [file, pm] of LOCKFILES) {
		if (existsSync(join(root, file))) return { pm, pmSource: "lockfile" };
	}
	const declared = String(pkg?.packageManager ?? "").split("@")[0];
	if (
		declared === "pnpm" ||
		declared === "npm" ||
		declared === "yarn" ||
		declared === "bun"
	) {
		return { pm: declared, pmSource: "packageManager" };
	}
	const agent = detectPackageManager();
	return agent
		? { pm: agent, pmSource: "user agent" }
		: { pm: DEFAULT_PM, pmSource: "default" };
}

function detectAliases(
	root: string,
	pkg: Record<string, unknown> | undefined,
): Alias[] {
	const aliases: Alias[] = [];
	const tsconfig = readJson(join(root, "tsconfig.json"));
	const options = tsconfig?.compilerOptions as
		| { paths?: Record<string, string[]> }
		| undefined;
	for (const [key, targets] of Object.entries(options?.paths ?? {})) {
		const target = targets[0];
		if (!key.endsWith("/*") || !target?.endsWith("/*")) continue;
		aliases.push({
			prefix: key.slice(0, -1),
			dir: join(root, target.slice(0, -2)),
			withExtension: false,
		});
	}
	const imports = (pkg?.imports ?? {}) as Record<string, unknown>;
	for (const [key, target] of Object.entries(imports)) {
		if (
			!key.endsWith("/*") ||
			typeof target !== "string" ||
			!target.endsWith("/*")
		)
			continue;
		aliases.push({
			prefix: key.slice(0, -1),
			dir: join(root, target.slice(0, -2)),
			withExtension: true,
		});
	}
	return aliases;
}

export function detectFramework(deps: ReadonlySet<string>): Framework {
	if (deps.has("next")) return "next";
	if (deps.has("@sveltejs/kit")) return "sveltekit";
	if (deps.has("@tanstack/react-start")) return "tanstack-start";
	return "standalone";
}

export function detectProject(root: string, framework?: Framework): Project {
	const pkg = readJson(join(root, "package.json"));
	const dependencies = new Set(
		Object.keys({
			...(pkg?.dependencies as object | undefined),
			...(pkg?.devDependencies as object | undefined),
		}),
	);
	const fw = framework ?? detectFramework(dependencies);
	const nextSrc = existsSync(join(root, "src", "app"));
	const srcDir =
		fw === "next" ? (nextSrc ? "src" : "") : fw === "standalone" ? "" : "src";
	const routesDir =
		fw === "next"
			? join(srcDir, "app")
			: fw === "standalone"
				? ""
				: join("src", "routes");
	return {
		root,
		framework: fw,
		...detectPm(root, pkg),
		srcDir,
		routesDir,
		dependencies,
		aliases: detectAliases(root, pkg),
		dollarLib: fw === "sveltekit" && kitMajor(root, pkg) < 3,
	};
}

const posix = (p: string) => p.split("\\").join("/");

// The installed version wins; the declared range covers an app whose install hasn't run yet.
function kitMajor(
	root: string,
	pkg: Record<string, unknown> | undefined,
): number {
	const installed = readJson(
		join(root, "node_modules", "@sveltejs", "kit", "package.json"),
	);
	const deps = {
		...(pkg?.dependencies as object | undefined),
		...(pkg?.devDependencies as object | undefined),
	} as Record<string, string>;
	const version = String(installed?.version ?? deps["@sveltejs/kit"] ?? "");
	const major = /(\d+)/.exec(version)?.[1];
	return major === undefined ? 3 : Number(major);
}

/** The import specifier for `target` (absolute, no extension) as written in `from`. */
export function importSpecifier(
	project: Project,
	from: string,
	target: string,
	extension: string,
): string {
	for (const alias of project.aliases) {
		const rest = relative(alias.dir, target);
		if (rest.startsWith("..") || /^[a-zA-Z]:/.test(rest)) continue;
		return `${alias.prefix}${posix(rest)}${alias.withExtension ? extension : ""}`;
	}
	if (project.framework === "sveltekit" && project.dollarLib) {
		const rest = relative(join(project.root, "src", "lib"), target);
		if (!rest.startsWith("..")) return `$lib/${posix(rest)}`;
	}
	const rel = posix(relative(join(from, ".."), target));
	return rel.startsWith(".") ? rel : `./${rel}`;
}
