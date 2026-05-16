# @docvia/runtime

The stateful compile service that backs every docvia mode.

`CompileService` holds the resolved config, plugin runner, incremental cache, and
in-memory module graph for the lifetime of a process. `@docvia/compiler` (batch
build), and — in later milestones — the dev-server plugins and SSR adapters all
drive this one service, so build, dev, and request-time output stay identical.

Not a public-facing API surface; consume `@docvia/compiler` or a framework
plugin instead.
