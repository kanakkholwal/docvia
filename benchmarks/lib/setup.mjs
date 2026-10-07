/**
 * Runs an install-type command (`pnpm install` by default). If pnpm refuses unapproved dependency
 * build scripts, runs the approval its error asks for, then the command again, and reports both.
 */
export async function installApproved(capture, app, cmd = "pnpm install") {
	try {
		const { ms } = await capture(cmd, { cwd: app });
		return { installMs: ms };
	} catch (err) {
		if (!/ERR_PNPM_IGNORED_BUILDS/.test(err.output ?? "")) throw err;
		const approve = await capture("pnpm approve-builds --all", { cwd: app });
		// Approving can leave optional native packages missing; running again completes it.
		const retry = await capture(cmd, { cwd: app });
		return { approveBuildsMs: approve.ms, installMs: retry.ms };
	}
}
