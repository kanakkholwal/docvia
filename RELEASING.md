# Releasing docvia

This monorepo publishes 13 packages under the `@docvia/*` scope. Releases are
managed with [changesets](https://github.com/changesets/changesets); the
workspace `package.json` exposes the standard scripts.

| Script | What it does |
|---|---|
| `pnpm changeset` | Author a new changeset (interactive) |
| `pnpm changeset:status` | List pending changesets vs. `origin/main` |
| `pnpm version-packages` | Consume pending changesets, bump versions, write CHANGELOGs |
| `pnpm release` | `pnpm build && changeset publish` (the actual publish) |

In normal day-to-day work, only `pnpm changeset` is run by hand. The CI
workflow at `.github/workflows/release.yml` handles version bumps and
publishing automatically once changesets land on `main`.

---

## What's in scope

**Published** (13 packages, all `@docvia/*`):

```
@docvia/cli              @docvia/renderer-core
@docvia/compiler         @docvia/renderer-react
@docvia/core             @docvia/renderer-svelte
@docvia/ir               @docvia/schema
@docvia/plugins          @docvia/search
@docvia/plugin-next      @docvia/source
@docvia/plugin-vite
```

**Not published** (4 private workspaces, ignored by `.changeset/config.json`):

```
@docvia/web   @docvia/docs   demo-next   demo-svelte
```

---

## One-time setup

### 1. Claim the npm scope

```bash
npm login
npm org create docvia
```

The org name `docvia` must be globally unique on npm. If it's already taken,
either pick a new scope (see *Renaming the scope* below) or contact the
existing owner.

### 2. Mint an npm token for CI

In <https://www.npmjs.com/settings/<your-user>/tokens> create an
**Automation** token with **Publish** scope, restricted to the `@docvia` scope.
Add it as the `NPM_TOKEN` secret on the GitHub repository:

```
gh secret set NPM_TOKEN
```

The default `GITHUB_TOKEN` provided to Actions covers everything else.

### 3. (Optional) Switch the changelog renderer back to GitHub-aware

For local testing the workspace uses the basic changelog renderer
(`@changesets/cli/changelog`), which works without any token. For richer
changelogs that link PRs and contributors, switch back to
`@changesets/changelog-github` once the repo is public:

```jsonc
// .changeset/config.json
"changelog": [
  "@changesets/changelog-github",
  { "repo": "kanakkholwal/docvia" }
],
```

That renderer requires `GITHUB_TOKEN` (provided automatically in CI; for local
runs export a personal token with `read:user, repo:status`).

---

## Day-to-day flow (local)

For every PR that changes a published package:

```bash
pnpm changeset
```

Pick the affected packages, choose the bump type (`patch` / `minor` / `major`),
and write a one-paragraph summary. A new file lands in `.changeset/`. Commit
it alongside the rest of your PR.

Skip changesets for PRs that only touch:

- `apps/*`
- `examples/*`
- Repository-level config (CI, `.gitignore`, root `README.md`, etc.)
- `packages/*/tests/**` if no behavior change

The CI lint step calls `pnpm changeset:status` and surfaces a notice when a PR
ships code without one — it doesn't fail the build, so use judgement.

---

## Release flow (CI)

`.github/workflows/release.yml` runs on every push to `main`:

1. **Install + build + test** the entire workspace.
2. Invoke `changesets/action@v1`, which:
   - **If pending changesets exist:** opens (or updates) a PR titled
     `chore(release): version packages`. The PR runs `pnpm version-packages`,
     which consumes every changeset, bumps `package.json` versions, rewrites
     workspace deps to exact versions, and updates per-package `CHANGELOG.md`.
   - **If no pending changesets exist:** runs `pnpm release`, which builds and
     calls `changeset publish` to push every package whose version is not yet
     on the registry. npm provenance is enabled (`NPM_CONFIG_PROVENANCE=true`)
     so each tarball is cryptographically attested to this exact CI run.

Practical result: you author changesets in feature PRs, merge them, the bot
opens a release PR, you review and merge that, and the next CI run publishes
to npm and pushes git tags.

---

## Manual / emergency publish

If CI is broken and you need to ship a fix:

```bash
# 1. Make sure you're up to date and authenticated to npm
git pull origin main
npm whoami                       # should show your @docvia org account

# 2. Bump and write CHANGELOGs
pnpm version-packages

# 3. Verify
git diff                         # review version bumps + CHANGELOGs
pnpm build                       # rebuild dist/ for every package
pnpm test                        # green

# 4. Optional dry-run inspection
pnpm -r --filter "@docvia/*" exec pnpm publish --dry-run --no-git-checks

# 5. Publish for real
pnpm release                     # = pnpm build && changeset publish

# 6. Push the version commits + tags created by changeset
git push --follow-tags origin main
```

`changeset publish` is idempotent — packages already at the registry version
on disk are skipped.

---

## Inspecting tarballs before publish

Each public package ships only what's listed in its `files` field
(`["dist", "README.md"]`) plus the workspace `LICENSE` (auto-included by npm).
To see exactly what would land on the registry:

```bash
cd packages/cli
pnpm publish --dry-run --no-git-checks
```

Sample output for `@docvia/cli`:

```
Tarball Contents
  34.4kB LICENSE
  1.7kB  README.md
  167B   dist/index.d.mts
  17.8kB dist/index.mjs
  33.2kB dist/index.mjs.map
  1.2kB  package.json
package size: 26.9 kB
unpacked size: 88.5 kB
```

The published `package.json` rewrites every `workspace:*` to the exact pinned
version (e.g. `@docvia/compiler: "0.1.0"`) — verified by:

```bash
cd packages/cli
pnpm pack
tar -xOf docvia-cli-0.1.0.tgz package/package.json | jq .dependencies
rm docvia-cli-0.1.0.tgz
```

---

## Versioning policy

While in **0.x preview**:

- `minor` bumps for new features and breaking changes (no semver guarantees yet).
- `patch` bumps for bug fixes that don't change the public API.
- Internal-dependency bumps inside the workspace use `patch` automatically —
  see `updateInternalDependencies: "patch"` in `.changeset/config.json`.

After **1.0**:

- Strict semver — `major` for breaking, `minor` for additive, `patch` for fixes.
- Every breaking change requires a migration note in the changeset body.

---

## Renaming the scope

If `@docvia` turns out to be unavailable on npm (or you need to ship under a
different scope for any reason):

```bash
# Replace @docvia with @new-scope across every package.json and source import.
node -e "
  import('node:fs/promises').then(async ({readFile, writeFile}) => {
    const { globby } = await import('globby');
    const files = await globby([
      'packages/**/package.json',
      'packages/**/src/**/*.{ts,tsx,svelte}',
      '.changeset/*.md',
      'apps/**/package.json',
      'examples/**/package.json',
    ], { gitignore: true });
    for (const f of files) {
      const before = await readFile(f, 'utf-8');
      const after = before.replaceAll('@docvia/', '@new-scope/');
      if (after !== before) {
        await writeFile(f, after);
        console.log('updated', f);
      }
    }
  });
"
pnpm install
pnpm build
pnpm test
```

Update `.changeset/config.json` (the `ignore` list still references the app
package names) and the workspace README. Test thoroughly, then publish.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Please create a GitHub personal access token` from `pnpm changeset version` | The `changelog-github` renderer needs `GITHUB_TOKEN` even locally. Either export the token or temporarily switch the renderer to `"@changesets/cli/changelog"`. |
| `403 Forbidden` on publish | Either you're not in the `@docvia` org, or the token doesn't have publish scope, or 2FA is required. Run `npm org ls docvia` to verify membership. |
| `EUNVERIFIEDSIGNATURE` from a consumer | Provenance signature mismatch — usually means the package was published outside CI. Republish from CI to restore. |
| `version-packages` produced unexpected bumps | Check pending changesets with `pnpm changeset:status` — a stray `major` changeset will dominate. |
| Workspace deps still show `workspace:*` in published tarball | You ran `npm publish` directly. Use `pnpm publish` or `changeset publish` so pnpm rewrites the specifier. |
