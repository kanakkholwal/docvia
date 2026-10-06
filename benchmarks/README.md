# Benchmarks

Compares documentation stacks on the same generated Markdown corpus. Each stack is created
with its own official CLI in a temporary directory, measured, and deleted afterwards.

```bash
pnpm bench                                   # every stack, 300 pages, 3 runs
pnpm bench --stacks docvia-sveltekit --pages 300,1500 --runs 5
pnpm bench --list                            # available stacks
pnpm bench --keep                            # keep the temporary apps for inspection
```

Results go to `benchmarks/results/<date>_<hh-mm-am|pm>/` (gitignored):

| File | Contents |
|---|---|
| `results.json` | Every sample, plus machine, Node, pnpm, git SHA and pinned versions |
| `results.md` | Median tables per corpus size, setup timings and installed versions |
| `logs/<stack>.log` | Full output of every command the stack ran |

The command exits non-zero if any stack failed; the other stacks still run and report.

## What is measured

| Metric | How |
|---|---|
| Build | Production build with caches cleared, median of `--runs` after one discarded warm-up |
| Dev ready | Dev server start until it answers any HTTP request |
| First page | Dev server start until a docs page renders its content |
| Edit visible | Writing a change to a page until the page serves it |
| New page | Creating a page until its URL serves it |
| Client JS, CSS | Raw and gzip bytes in the build's browser output |
| Setup | Create, install and add-docs time, once per stack |

Dev metrics run in fresh sessions with caches cleared, the same warm-up rule applies.

## Rules

- Same corpus for every stack: plain Markdown with headings, lists, tables and code blocks.
- Each stack keeps its starter's defaults; only content and the docs route are added.
- Create CLIs are pinned in `versions.json`; installed framework versions are recorded per run.
- docvia stacks install this repo's packages, built and packed first (`--skip-build` reuses
  the current build).
- Every server is killed with its whole process tree, and the temporary directory is removed on
  exit, error or Ctrl+C.

## Adding a stack

Create `stacks/<id>.mjs` exporting a `Stack` (see `stacks/types.mjs`) and add it to
`stacks/index.mjs`. `setup()` must use only CLI commands, so the measured app is what a developer
gets from the official starter.
