<script lang="ts">
import type { ApiOverview } from "@docvia/plugin-openapi/source";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { CopyButton } from "#lib/components/ui/copy-button/index.ts";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#lib/components/ui/table/index.ts";
import ApiPath from "./api-path.svelte";
import Markdown from "./markdown.svelte";
import MethodBadge from "./method-badge.svelte";
import Panel from "./panel.svelte";
import SectionHeading from "./section-heading.svelte";

let { api }: { api: ApiOverview } = $props();

const groupId = (name: string) => `group-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
</script>

<div class="flex flex-col">
	<Markdown html={api.description} />

	{#if api.servers.length > 0}
		<Panel class="mt-6">
			{#snippet header()}
				<span class="font-medium text-ink">Base URL</span>
				{#if api.version}<Badge variant="secondary" size="sm">v{api.version}</Badge>{/if}
			{/snippet}
			<div class="divide-y divide-border">
				{#each api.servers as server (server.url)}
					<div class="flex items-center gap-3 px-4 py-2.5 text-sm">
						<span class="min-w-0 flex-1 break-all text-ink">{server.url}</span>
						{#if server.description}<span class="text-muted">{server.description}</span>{/if}
						<CopyButton text={server.url} iconOnly label="Copy base URL" />
					</div>
				{/each}
			</div>
		</Panel>
	{/if}

	{#each api.groups as group (group.name)}
		<SectionHeading id={groupId(group.name)}>{group.name}</SectionHeading>
		{#if group.description}<p class="mb-4 text-body">{group.description}</p>{/if}
		<Table variant="framed">
			<TableHeader>
				<TableRow>
					<TableHead class="w-20">Method</TableHead>
					<TableHead>Endpoint</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each group.operations as op (op.url)}
					<TableRow class="relative">
						<TableCell class="align-top">
							<MethodBadge method={op.method} />
						</TableCell>
						<TableCell>
							<a href={op.url} class="flex flex-col gap-0.5 after:absolute after:inset-0">
								<span class="font-medium text-ink">
									{op.summary}
									{#if op.deprecated}<Badge variant="destructive" size="sm" class="ml-1.5">Deprecated</Badge>{/if}
								</span>
								<ApiPath path={op.path} class="font-normal text-muted text-xs" />
							</a>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{/each}
</div>
