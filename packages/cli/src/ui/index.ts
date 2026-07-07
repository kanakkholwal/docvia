// Interactive terminal-UI toolkit for the docvia CLI.
//
// A tiny, dependency-free alternative to prompt libraries like @clack/prompts —
// same "rail" aesthetic, zero supply-chain surface, no bundle cost. Every
// prompt falls back to its default on non-interactive streams, so scripted and
// CI usage never blocks on input.
export { printBanner } from "./banner";
export {
	isInteractive,
	type Key,
	PromptCancelled,
} from "./core";
export {
	type ConfirmOptions,
	cancelOutro,
	confirm,
	intro,
	type MultiSelectOptions,
	message,
	multiselect,
	note,
	outro,
	type SelectOption,
	type SelectOptions,
	type Spinner,
	select,
	spinner,
	type TextOptions,
	text,
} from "./prompts";
export { S, type StepStatus } from "./theme";
