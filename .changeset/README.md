# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Each time you make a user-facing change to a `@docvia/*` package, run:

```bash
pnpm changeset
```

It will ask which packages changed and what type of bump they need (patch / minor / major), then write a small markdown file in this folder. Commit that file alongside your code change. CI will use these files to bump versions and publish to npm when merged to `main`.

You can delete this README anytime; it has no effect.
