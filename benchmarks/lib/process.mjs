import { execSync, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { connect, createServer } from "node:net";
import { performance } from "node:perf_hooks";

const live = new Set();
const isWindows = process.platform === "win32";

function spawnShell(cmd, { cwd, env, log }) {
	const out = createWriteStream(log, { flags: "a" });
	out.write(`\n$ ${cmd}  (${cwd})\n`);
	const child = spawn(cmd, {
		cwd,
		// pnpm freezes lockfiles when CI is set; the throwaway starters must be free to write theirs.
		env: { ...process.env, npm_config_frozen_lockfile: "false", ...env },
		shell: true,
		// No stdin: an open pipe makes some CLIs wait for input forever.
		stdio: ["ignore", "pipe", "pipe"],
		// Own process group on POSIX, so the whole tree can be killed at once.
		detached: !isWindows,
	});
	child.stdout.pipe(out, { end: false });
	child.stderr.pipe(out, { end: false });
	child.on("close", () => out.end());
	live.add(child);
	return child;
}

/** Runs `cmd` to completion with output appended to `log`. Resolves with its duration and output. */
export function runCapture(
	cmd,
	{ cwd, env = {}, log, timeoutMs = 20 * 60_000 },
) {
	return new Promise((resolve, reject) => {
		const t0 = performance.now();
		const child = spawnShell(cmd, { cwd, env, log });
		let output = "";
		child.stdout.on("data", (chunk) => {
			output += chunk;
		});
		child.stderr.on("data", (chunk) => {
			output += chunk;
		});
		const timer = setTimeout(() => killTree(child), timeoutMs);
		child.on("error", reject);
		child.on("close", (code) => {
			clearTimeout(timer);
			live.delete(child);
			if (code === 0) {
				resolve({ ms: performance.now() - t0, output });
				return;
			}
			const error = new Error(`\`${cmd}\` exited with ${code} (log: ${log})`);
			error.output = output;
			reject(error);
		});
	});
}

/** Runs `cmd` to completion with output appended to `log`. Resolves with the duration in ms. */
export async function run(cmd, opts) {
	return (await runCapture(cmd, opts)).ms;
}

/** Starts a long-running command such as a dev server. Stop it with `killTree`. */
export function start(cmd, { cwd, env = {}, log }) {
	return spawnShell(cmd, { cwd, env, log });
}

export function killTree(child) {
	if (child.pid === undefined || child.exitCode !== null) {
		live.delete(child);
		return;
	}
	try {
		if (isWindows) {
			execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
		} else {
			process.kill(-child.pid, "SIGKILL");
		}
	} catch {
		// Already gone.
	}
	live.delete(child);
}

export function killAll() {
	for (const child of [...live]) killTree(child);
}

export function freePort() {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.on("error", reject);
		server.listen(0, () => {
			const { port } = server.address();
			server.close(() => resolve(port));
		});
	});
}

/** True once something accepts TCP connections on `port`. */
export function portOpen(port) {
	return new Promise((resolve) => {
		const socket = connect({ port, host: "localhost" });
		socket.once("connect", () => {
			socket.destroy();
			resolve(true);
		});
		socket.once("error", () => resolve(false));
	});
}

export async function fetchText(url) {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
		return { status: res.status, text: await res.text() };
	} catch {
		return { status: 0, text: "" };
	}
}

/** Polls `check` until it returns true. Resolves with the elapsed ms. */
export async function waitFor(check, { label, timeoutMs = 5 * 60_000 }) {
	const t0 = performance.now();
	for (;;) {
		if (await check()) return performance.now() - t0;
		if (performance.now() - t0 > timeoutMs) {
			throw new Error(`timed out after ${timeoutMs} ms waiting for ${label}`);
		}
		await new Promise((r) => setTimeout(r, 50));
	}
}
