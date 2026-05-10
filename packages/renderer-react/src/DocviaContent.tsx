import type { ComponentRegistry, RenderOutput } from "@docvia/renderer-core";
import React from "react";

// Component override types
/**
 * Props passed to a custom code block component.
 * `html` is the pre-rendered syntax-highlighted markup from shiki.
 */
export interface CodeBlockOverrideProps {
	html: string;
	id?: string;
	className: string;
}

/**
 * Tag-level and semantic-level component overrides — fumadocs-inspired.
 *
 * Tag overrides let you swap any HTML element for a custom React component:
 *   - `a`   → `next/link`  for client-side navigation
 *   - `img` → `next/image` for optimised images
 *
 * The `codeBlock` slot overrides the entire code block render, receiving
 * the pre-rendered shiki HTML so you can add copy buttons, language tabs, etc.
 */
export interface DocviaComponents {
	/**
	 * Override code block rendering. Receives the raw shiki HTML and block id.
	 * Falls back to `<div class="docvia-code-block" dangerouslySetInnerHTML>`.
	 */
	codeBlock?: React.ComponentType<CodeBlockOverrideProps>;

	/** Override all anchor tags — ideal for `next/link`. */
	a?: React.ComponentType<
		React.AnchorHTMLAttributes<HTMLAnchorElement> & {
			children?: React.ReactNode;
		}
	>;

	/** Override all images — ideal for `next/image`. */
	img?: React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement>>;

	/** Override any other HTML tag by name. */
	[tag: string]: React.ComponentType<any> | undefined;
}

export interface DocviaContentProps {
	/** Serialised RenderOutput produced by renderDocument(). */
	nodes: RenderOutput | RenderOutput[];
	/** Registry for resolving custom directive components. */
	registry?: ComponentRegistry;
	/**
	 * Custom components to override default rendering.
	 * Fumadocs-style tag overrides + semantic `codeBlock` slot.
	 */
	components?: DocviaComponents;
}

/**
 * Renders a docvia RenderOutput tree into React elements.
 *
 * No hooks or browser APIs — works as a React Server Component in the
 * Next.js App Router with no `"use client"` directive required.
 * Works identically with SSR (renderToString) and client rendering.
 */
export function DocviaContent({
	nodes,
	registry,
	components,
}: DocviaContentProps): React.ReactElement {
	const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
	return (
		<>
			{nodeArray.map((node, i) => (
				<DocviaNode
					key={getNodeKey(node, i)}
					node={node}
					registry={registry}
					components={components}
				/>
			))}
		</>
	);
}

// Internal recursive node renderer

interface NodeProps {
	node: RenderOutput;
	registry?: ComponentRegistry;
	components?: DocviaComponents;
}

function DocviaNode({
	node,
	registry,
	components,
}: NodeProps): React.ReactElement | null {
	switch (node.kind) {
		case "text":
			return <>{node.value}</>;

		// Raw HTML (e.g. from syntax highlighter). Only fires when an html node
		// appears outside an element — the element collapse path handles the
		// normal code-block case without this extra wrapper.
		case "html":
			// biome-ignore lint/security/noDangerouslySetInnerHtml: it is being sanitized first
			return <div dangerouslySetInnerHTML={{ __html: node.value }} />;

		case "fragment":
			return (
				<>
					{(node.children ?? []).map((child, i) => (
						<DocviaNode
							key={getNodeKey(child, i)}
							node={child}
							registry={registry}
							components={components}
						/>
					))}
				</>
			);

		case "element": {
			const { tag, props = {}, children, id } = node;

			// ---- Code-block collapse -----------------------------------------
			// The default code-block renderer emits:
			//   { kind: 'element', tag: 'div', class: 'docvia-code-block',
			//     children: [{ kind: 'html', value: '<pre>…</pre>' }] }
			//
			// Collapse all-html children into dangerouslySetInnerHTML on the
			// parent element — avoids an extra <div> wrapper around shiki output
			// and keeps both SSR and CSR HTML clean.
			if (children?.length && children.every((c) => c.kind === "html")) {
				const raw = (children as Array<Extract<RenderOutput, { kind: "html" }>>)
					.map((c) => c.value)
					.join("");

				const { class: cls, ...restRaw } = props;
				const reactProps: Record<string, unknown> = { ...restRaw };
				if (cls) reactProps.className = cls;
				if (id) reactProps["data-hid"] = id;

				// Semantic codeBlock override slot
				const CodeBlock = components?.codeBlock;
				if (
					CodeBlock &&
					tag === "div" &&
					reactProps.className === "docvia-code-block"
				) {
					return <CodeBlock html={raw} id={id} className="docvia-code-block" />;
				}

				return React.createElement(tag, {
					...reactProps,
					dangerouslySetInnerHTML: { __html: raw },
				});
			}

			// ---- Generic element ---------------------------------------------
			// Map HTML attribute names → React prop names.
			// `class` → `className`: React 18 warns on `class`; React 19 accepts
			// both but className is canonical and avoids hydration mismatches.
			const { class: cls, ...restProps } = props;
			const reactProps: Record<string, unknown> = { ...restProps };
			if (cls) reactProps.className = cls;
			if (id) reactProps["data-hid"] = id;

			// Tag-level override (e.g. next/link for <a>, next/image for <img>)
			const Override = components?.[tag];
			if (Override) {
				return (
					<Override {...reactProps}>
						{renderChildren(children, registry, components)}
					</Override>
				);
			}

			return React.createElement(
				tag,
				reactProps,
				...renderChildrenArray(children, registry, components),
			);
		}

		case "component": {
			const { name, props = {}, children, id } = node;
			const resolved = registry?.resolve(name);

			if (!resolved) {
				return (
					<div className="docvia-render-error" data-missing-component={name}>
						Unknown component: {name}
					</div>
				);
			}

			// React.ElementType works for both function components and class components,
			// and is compatible with React 18 and 19 (no forwardRef assumption).
			const Component = resolved.component as React.ElementType;

			const childSlot =
				(children ?? []).length > 0 ? (
					<DocviaContent
						nodes={children!}
						registry={registry}
						components={components}
					/>
				) : undefined;

			return (
				// data-hid is the anchor point for client-side island hydration
				<div data-hid={id} className="docvia-component-wrapper">
					<Component {...(props as Record<string, unknown>)}>
						{childSlot}
					</Component>
				</div>
			);
		}

		default:
			return null;
	}
}

// Child rendering helpers

/** Returns children as a flat array for React.createElement spread. */
function renderChildrenArray(
	children: RenderOutput[] | undefined,
	registry: ComponentRegistry | undefined,
	components: DocviaComponents | undefined,
): Array<React.ReactElement | null> {
	if (!children?.length) return [];
	return children.map((child, i) => (
		<DocviaNode
			key={getNodeKey(child, i)}
			node={child}
			registry={registry}
			components={components}
		/>
	));
}

/** Returns children wrapped in a fragment for JSX children prop. */
function renderChildren(
	children: RenderOutput[] | undefined,
	registry: ComponentRegistry | undefined,
	components: DocviaComponents | undefined,
): React.ReactElement | null {
	if (!children?.length) return null;
	return (
		<>
			{children.map((child, i) => (
				<DocviaNode
					key={getNodeKey(child, i)}
					node={child}
					registry={registry}
					components={components}
				/>
			))}
		</>
	);
}

function getNodeKey(node: RenderOutput, index: number): string {
	switch (node.kind) {
		case "component":
		case "element":
			return node.id ?? `${node.kind}:${node.tag}:${index}`;
		case "text":
			return `text:${index}:${node.value}`;
		case "html":
			return `html:${index}:${node.value}`;
		case "fragment":
			return `fragment:${index}:${node.children.length}`;
	}
}
