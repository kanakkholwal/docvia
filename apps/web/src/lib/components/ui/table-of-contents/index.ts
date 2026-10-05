export {
	default as TableOfContents,
	default as Root,
} from "./table-of-contents.svelte";
export {
	activeRange,
	buildTrack,
	idsInRange,
	itemPad,
	itemRail,
	movedUp,
	railX,
	rangeFromIds,
	type TocDepth,
	type TocItem,
	type TocRange,
	type TocRow,
	type TocTrack,
	thumbStyle,
} from "./toc-core";
export { type TableOfContentsVariant, tableOfContents } from "./variants";
