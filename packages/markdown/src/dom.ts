import { type HtmlOptions, renderBlocks, toHtml } from "./html";
import { type AnimateOptions, createMotion, motionStyle } from "./motion";
import { createMarkdownStream, type StreamOptions } from "./stream";
import { injectStyles } from "./styles";

export type { AnimateOptions, Effect } from "./motion";
export { STYLES } from "./styles";

export interface DomOptions extends HtmlOptions, StreamOptions {
	/** Animate words as they arrive; `false` turns it off. Reduced-motion users never see it. */
	animate?: AnimateOptions | false;
	/** A blinking caret after the last word while streaming. Default true. */
	caret?: boolean;
	/** Ease the container's height between updates. Default true. */
	smoothHeight?: boolean;
}

/** Renders Markdown into an element once, replacing its content. */
export function renderMarkdown(
	el: HTMLElement,
	markdown: string,
	options: HtmlOptions = {},
): void {
	el.innerHTML = toHtml(markdown, options);
}

/** Wraps words in spans; words that start before `from` characters were already shown and stay still. */
function wrapWords(root: Element, from: number) {
	const doc = root.ownerDocument;
	const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	for (let n = walker.nextNode(); n; n = walker.nextNode())
		nodes.push(n as Text);
	let offset = 0;
	for (const node of nodes) {
		const start = offset;
		offset += node.data.length;
		if (node.parentElement?.closest("pre")) continue;
		const frag = doc.createDocumentFragment();
		let at = start;
		for (const part of node.data.split(/(\s+)/)) {
			if (part && /^\s+$/.test(part)) frag.append(part);
			else if (part) {
				const span = doc.createElement("span");
				span.dataset.mdWord = at < from ? "s" : "";
				span.textContent = part;
				frag.append(span);
			}
			at += part.length;
		}
		node.replaceWith(frag);
	}
}

export interface StreamRenderer {
	push(chunk: string): void;
	end(): void;
	/** Clears the element and starts a new stream. */
	reset(): void;
}

/** Streams Markdown into an element: finished blocks stay put, only the live tail is rewritten. */
export function createStreamRenderer(
	el: HTMLElement,
	options: DomOptions = {},
): StreamRenderer {
	const doc = el.ownerDocument;
	const animate = options.animate === false ? null : (options.animate ?? {});
	if (animate || options.caret !== false) injectStyles(doc);
	if (animate)
		for (const [name, value] of Object.entries(motionStyle(animate)))
			el.style.setProperty(name, value);
	const motion = createMotion(el);
	let stream = createMarkdownStream(options);
	let rendered = new Map<
		string,
		{ el: HTMLElement; html: string; text: number }
	>();
	let heightAnimation: Animation | undefined;

	function update(blocks: ReturnType<typeof stream.push>, final: boolean) {
		const before = options.smoothHeight === false ? 0 : el.offsetHeight;
		const keep = new Set<string>();
		let previous: Element | null = null;
		for (const block of blocks) {
			keep.add(block.key);
			const html = renderBlocks([block.node], options);
			let entry = rendered.get(block.key);
			if (!entry) {
				const wrapper = doc.createElement("div");
				wrapper.style.display = "contents";
				wrapper.dataset.mdBlock = block.key;
				entry = { el: wrapper, html: "", text: 0 };
				rendered.set(block.key, entry);
				if (previous) previous.after(wrapper);
				else el.prepend(wrapper);
			}
			if (entry.html !== html) {
				entry.el.innerHTML = html;
				if (animate) wrapWords(entry.el, entry.text);
				entry.html = html;
				entry.text = entry.el.textContent?.length ?? 0;
			}
			previous = entry.el;
		}
		for (const [key, entry] of rendered) {
			if (keep.has(key)) continue;
			entry.el.remove();
			rendered.delete(key);
		}
		motion.update(final, animate, options.caret !== false);
		if (before && !final) {
			const after = el.offsetHeight;
			if (after !== before) {
				heightAnimation?.cancel();
				const overflow = el.style.overflow;
				el.style.overflow = "hidden";
				heightAnimation = el.animate(
					[{ height: `${before}px` }, { height: `${after}px` }],
					{ duration: 180, easing: "ease-out" },
				);
				heightAnimation.onfinish = heightAnimation.oncancel = () => {
					el.style.overflow = overflow;
				};
			}
		}
	}

	return {
		push(chunk) {
			update(stream.push(chunk), false);
		},
		end() {
			update(stream.end(), true);
		},
		reset() {
			stream = createMarkdownStream(options);
			rendered = new Map();
			motion.reset();
			el.replaceChildren();
		},
	};
}
