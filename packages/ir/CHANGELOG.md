# @docvia/ir

## 0.1.0

### Minor Changes

- 371b0f6: # v0.1 — Public preview

  First public preview of docvia. APIs are stabilizing; expect breaking changes
  before v1.0.

  ### Added

  - **Incremental builds.** The compiler now persists `.docvia.cache.json` and
    skips files whose content hash and pipeline cache key are unchanged.
    `CompileResult.stats.cached` now reflects real numbers.
  - **`compile()` accepts `projectRoot` and `incremental`.** `projectRoot`
    controls where `docvia-env.d.ts` is emitted (no longer assumes
    `process.cwd()`). `incremental: false` forces a full rebuild.
  - **`docvia init --renderer react|svelte|none`.** The scaffold now produces a
    config that builds without further edits and autodetects the renderer from
    `package.json` when omitted. `--force` overwrites an existing config.
  - **`docvia dev` hardening.** Build lock prevents concurrent rebuilds racing
    on `dynamic.ts` writes; the config file is watched alongside the source
    directory; `SIGINT`/`SIGTERM` close the watcher cleanly. Rebuild logs now
    show the changed-file count.
  - **`docvia build --no-cache`.** Disables the incremental cache for one run.
  - **Plugin error context.** Errors thrown from plugin hooks are wrapped in a
    `docviaError` carrying the plugin's name, version, and hook name.
  - **Stable config hashing.** Config hash is computed from a sorted-key JSON
    serialization, so cosmetic key reordering no longer invalidates the cache.
  - **`loadConfig` validation.** Throws a clear `CONFIG_ERROR` when the config
    file does not export an object.
  - **Parallelized file discovery.** `readFileTree` now reads directories and
    files in parallel batches.
  - **`defineConfig` passes through `collections`.** Previously the
    user-supplied `collections` array was silently dropped.

  ### Changed

  - **`@docvia/cli` no longer depends on `@docvia/renderer-svelte`.** Renderers
    are installed by the consumer (`@docvia/renderer-react` or
    `@docvia/renderer-svelte`).
  - **CLI entry detection** uses a real-path comparison of `process.argv[1]`
    against `import.meta.url`, instead of substring matching.
  - **`docvia preview`** now prints a one-time notice clarifying that it serves
    the raw `.docvia/` output and is not a standalone runtime.

  ### Fixed

  - `defineConfig` previously dropped the `collections` field.
  - `docvia-env.d.ts` was written to `process.cwd()` regardless of where the
    config lived; it now resolves relative to the config's directory.
  - The destructive `postinstall: pnpm run reset` script has been removed from
    the workspace root.

  ### Known limitations

  - Only `syntax.highlighter: "shiki"` is implemented; `"prism"` is reserved.
  - `dependencyHashes` is still empty in `computeContentHash` — cross-file
    dependency tracking is planned for v0.2.
  - Frontmatter extension schemas use `passthrough()`; unknown keys are not
    rejected.
