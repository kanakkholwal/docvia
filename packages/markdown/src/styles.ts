// Inline spans ignore `transform`, so movement animates `top`/`left` on relatively positioned words.
export const STYLES = `[data-md-word]{position:relative;animation:var(--md-effect,md-fade) var(--md-duration,240ms) var(--md-easing,ease-out) both}
[data-md-word=s]{animation:none}
@keyframes md-fade{from{opacity:0}}
@keyframes md-blur{from{opacity:0;filter:blur(6px)}}
@keyframes md-rise{from{opacity:0;top:.4em}}
@keyframes md-settle{from{opacity:0;top:-.25em;filter:blur(2px)}}
@keyframes md-wipe{from{clip-path:inset(-1em 100% -1em -1em)}to{clip-path:inset(-1em)}}
[data-md-caret]::after{content:"";display:inline-block;width:.5em;height:1em;margin-left:2px;vertical-align:-.15em;background:currentColor;animation:md-caret 1s steps(1) infinite}
@keyframes md-caret{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){[data-md-word],[data-md-caret]::after{animation:none}}`;

/** Adds the animation and caret styles to a document once. */
export function injectStyles(doc: Document): void {
	if (doc.getElementById("docvia-markdown-styles")) return;
	const style = doc.createElement("style");
	style.id = "docvia-markdown-styles";
	style.textContent = STYLES;
	doc.head.append(style);
}
