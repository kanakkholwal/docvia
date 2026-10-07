/**
 * @typedef {object} SetupContext
 * @property {string} dir Empty directory to create the app in.
 * @property {(cmd: string, opts: { cwd: string, env?: Record<string, string> }) => Promise<number>} sh
 *   Runs a command with output logged; resolves with its duration in ms.
 * @property {(cmd: string, opts: { cwd: string, env?: Record<string, string> }) => Promise<{ ms: number, output: string }>} capture
 *   Like `sh`, but also resolves with the command's output.
 * @property {Record<string, string>} pins Pinned tool versions from `versions.json`.
 * @property {{ cli: string, tarballs: string } | undefined} docvia Packed docvia, for docvia stacks.
 * @property {string} log The stack's log file.
 */

/**
 * @typedef {object} Stack
 * @property {string} id
 * @property {string} label
 * @property {string} tool
 * @property {string} framework
 * @property {"ssr" | "static"} workers How the stack deploys to Cloudflare Workers.
 * @property {boolean} [requiresDocvia] Needs this repo's packages packed first.
 * @property {string} [knownIssue] Why the starter cannot be measured today; skipped unless named
 *   in `--stacks`.
 * @property {Record<string, string>} [platformIssues] Like `knownIssue`, per `process.platform`.
 * @property {string} contentDir Where the corpus goes, relative to the app.
 * @property {".md" | ".mdx"} [contentExt] Page file extension the starter picks up (default `.md`).
 * @property {"files" | "routes"} [contentLayout] `slug.md` (default) or `slug/+page.md` routes.
 * @property {string} docsPath URL prefix of the docs pages.
 * @property {string[]} caches Dev and build caches removed before every measured run.
 * @property {string} clientDir Build output served to browsers, for size measurement.
 * @property {string[]} versionsOf Packages whose installed versions are recorded.
 * @property {(ctx: SetupContext) => Promise<{ app: string, timings: Record<string, number> }>} setup
 * @property {(port: number) => string} dev Dev server command on `port`.
 * @property {string} build Production build command.
 * @property {(port: number) => string | { cmd: string, env: Record<string, string> }} preview
 *   Serves the production build on `port`.
 */

export {};
