<script lang="ts">
import type { ApiMethod } from "@docvia/plugin-openapi/source";
import { Badge, type BadgeSize, type BadgeVariant } from "#lib/components/ui/badge/index.ts";

let { method, size = "sm", class: className }: { method: ApiMethod; size?: BadgeSize; class?: string } =
	$props();

const TONE: Record<ApiMethod, BadgeVariant> = {
	GET: "info",
	POST: "success",
	PUT: "warning",
	PATCH: "warning",
	DELETE: "destructive",
	OPTIONS: "secondary",
	HEAD: "secondary",
	TRACE: "secondary",
};
</script>

<Badge variant={TONE[method]} {size} class={className}>{method}</Badge>
