/**
 * @typedef {object} SetupContext
 * @property {string} dir Empty directory to create the app in.
 * @property {(cmd: string, opts: { cwd: string, env?: Record<string, string> }) => Promise<number>} sh
 *   Runs a command with output logged; resolves with its duration in ms.
 * @property {Record<string, string>} pins Pinned tool versions from `versions.json`.
 * @property {{ cli: string, tarballs: string } | undefined} docvia Packed docvia, for docvia stacks.
 */

/**
 * @typedef {object} Stack
 * @property {string} id
 * @property {string} label
 * @property {string} tool
 * @property {string} framework
 * @property {"ssr" | "static"} workers How the stack deploys to Cloudflare Workers.
 * @property {boolean} [requiresDocvia] Needs this repo's packages packed first.
 * @property {string} contentDir Where the corpus goes, relative to the app.
 * @property {string} docsPath URL prefix of the docs pages.
 * @property {string[]} caches Dev and build caches removed before every measured run.
 * @property {string} clientDir Build output served to browsers, for size measurement.
 * @property {string[]} versionsOf Packages whose installed versions are recorded.
 * @property {(ctx: SetupContext) => Promise<{ app: string, timings: Record<string, number> }>} setup
 * @property {(port: number) => string} dev Dev server command on `port`.
 * @property {string} build Production build command.
 */

export {};
