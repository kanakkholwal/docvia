import { resolve, sep } from "node:path";

// Windows paths are case-insensitive, and launchers disagree on drive/dir casing.
const foldCase = process.platform === "win32";
const fold = (p: string): string => (foldCase ? p.toLowerCase() : p);

/** True when `a` and `b` name the same file. */
export function samePath(a: string, b: string): boolean {
	return fold(resolve(a)) === fold(resolve(b));
}

/**
 * `file`'s posix path relative to `dir`, or `undefined` when it isn't inside `dir`.
 * Look-alike siblings (`docs-old` vs `docs`) don't match.
 */
export function relativeInside(dir: string, file: string): string | undefined {
	const d = resolve(dir);
	const f = resolve(file);
	const prefix = d.endsWith(sep) ? d : d + sep;
	if (!fold(f).startsWith(fold(prefix))) return undefined;
	return f.slice(prefix.length).split(sep).join("/");
}
