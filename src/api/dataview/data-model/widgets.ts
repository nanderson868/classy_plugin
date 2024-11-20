import {
	ExternalLinkWidget,
	ListPairWidget,
	Widget,
	type Literal,
} from "./value";

/** Create a list pair widget matching the given key and value. */
export function listPair(key: Literal, value: Literal): ListPairWidget {
	return new ListPairWidget(key, value);
}

/** Create an external link widget which renders an external Obsidian link. */
export function externalLink(
	url: string,
	display?: string
): ExternalLinkWidget {
	return new ExternalLinkWidget(url, display);
}

/** Checks if the given widget is a list pair widget. */
export function isListPair(widget: Widget): widget is ListPairWidget {
	return widget.$widget === "dataview:list-pair";
}

export function isExternalLink(widget: Widget): widget is ExternalLinkWidget {
	return widget.$widget === "dataview:external-link";
}

/** Determines if the given widget is any kind of built-in widget with special rendering handling. */
export function isBuiltin(widget: Widget): boolean {
	return isListPair(widget) || isExternalLink(widget);
}
