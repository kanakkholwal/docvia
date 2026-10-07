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
| Dev ready | Dev server start until it accepts connections |
| First page | Dev server start until a docs page renders its content |
| Edit visible | Writing a change to a page until the page serves it |
| New page | Creating a page until its URL serves it |
| Page HTML, JS, CSS | Gzip bytes a browser loads for one docs page from the production server: the HTML, then its scripts, module preloads and stylesheets |
| Build JS total | Gzip bytes of every JS file in the browser build output, including lazily loaded chunks |
| Setup | Create, install and add-docs time, once per stack |

Dev metrics run in fresh sessions with caches cleared, the same warm-up rule applies. An edit or new
page that does not show up within 60 s is recorded as "not seen" (`null`) and the run continues.

## Rules

- Same corpus for every stack: plain Markdown with headings, lists, tables and code blocks.
  Stacks whose starters only read MDX get the same pages as `.mdx`; the content is valid as both.
- Extra setup a starter needs is run and reported, never hidden: fumadocs starters need
  `pnpm approve-builds --all` before pnpm 10+ will run their scripts.
- Each stack keeps its starter's defaults; only content and the docs route are added.
- Create CLIs are pinned in `versions.json`; installed framework versions are recorded per run.
- docvia stacks install this repo's packages, built and packed first (`--skip-build` reuses
  the current build).
- Every server is killed with its whole process tree, and the temporary directory is removed on
  exit, error or Ctrl+C.

## CI

`.github/workflows/benchmarks.yml` runs weekly and on demand (Actions > Benchmarks > Run workflow, with
optional stacks, page sizes and run count). Each stack gets its own runner, so a heavy build cannot
starve another of memory; `benchmarks/merge.mjs` then combines the per-runner results into one
report, shown in the job summary and uploaded as the `benchmark-results` artifact. CI never commits.

Stacks with a `knownIssue`, or a `platformIssues` entry for the current OS, are left out of default
runs and listed as skipped with the reason. Naming a stack in `--stacks` runs it anyway.

## Publishing to the homepage

```bash
pnpm bench --pages 300,1500
node benchmarks/publish.mjs            # newest run, or pass a results folder
```

`publish.mjs` writes docvia's setup numbers to `apps/web/src/lib/benchmarks/setup.json` with the
commit, machine and results folder they came from. It refuses a run with a failed stack, fewer than
3 runs, or uncommitted changes, so published numbers always match committed code.

## Adding a stack

Create `stacks/<id>.mjs` exporting a `Stack` (see `stacks/types.mjs`) and add it to
`stacks/index.mjs`. `setup()` must use only CLI commands, so the measured app is what a developer
gets from the official starter.
