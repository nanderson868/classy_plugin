/* eslint-disable @typescript-eslint/no-unused-vars */
import MyPlugin from "@/main";
import {
	AbstractInputSuggest,
	App,
	type SearchResult,
	prepareFuzzySearch,
} from "obsidian";
import { FieldOptions } from "../types";
import { Logger } from "./logging";

/*
 * Class that can be added to an existing textElement to add suggestions.
 * It needs an implementation of `getContent` to provide the set of things to suggest from
 * By default it does a FuzzySearch over these: this can be changed to a simple search
 * by overriding `getSuggestions`
 * `targetMatch` is a regex that finds the part of the input to use as a search term
 * It should provide two groups: the first one is left alone, the second one is the
 * search term, and is replaced by the result of the suggestions. By default, it's
 * a comma separator.
 *
 */
abstract class AddTextSuggest extends AbstractInputSuggest<string> {
	content: string[] = [];
	targetMatch = /^(.*),\s*([^,]*)/; // Example match: "a, b" -> ["a", "b"]
	// api: DataviewApi;
	protected log: Logger = new Logger().setContext(this);
	/**
	 * Constructs an instance of AddTextSuggest.
	 * @param textEl The HTML input or div element to attach the suggest functionality.
	 * @param app The Obsidian app instance.
	 * @param onSelectCb Callback function to execute when a suggestion is selected.
	 */
	constructor(
		private textEl: HTMLInputElement | HTMLDivElement,
		app: App,
		protected plugin: MyPlugin,
		protected onSelectCb: (value: string) => void = (v) => v
	) {
		super(app, textEl);
		// if (!isPluginEnabled(this.app))
		// 	throw new Error("Dataview plugin not enabled");
		// this.api = getAPI(this.app);
		// if (!this.api) throw new Error("Dataview API not available");
		// this.api = this.plugin.
		this.initializeContent();
	}

	/**
	 * Initializes the content for suggestions by fetching it asynchronously.
	 */
	private async initializeContent(): Promise<void> {
		const content = await this.getContent();
		this.content = content;
	}

	/**
	 * Retrieves suggestions based on the input string.
	 * @param inputStr The input string from the text element.
	 * @returns An array of suggestion strings.
	 */
	getSuggestions(inputStr: string): string[] {
		return this.doFuzzySearch(this.getParts(inputStr)[1]);
	}

	/**
	 * Splits the input into the initial part and the target part for searching.
	 * @param input The complete input string.
	 * @returns A tuple containing the initial part and the target part.
	 */
	getParts(input: string): [string, string] {
		this.log.debug("getParts input:", input);
		if (!input) {
			this.log.debug("Input is undefined or null");
			return ["", ""];
		}
		const m = input.match(this.targetMatch);
		if (m) {
			return [m[1], m[2]];
		} else {
			return ["", input];
		}
	}

	/**
	 * Performs a simple search for the target string within the content.
	 * @param target The string to search for.
	 * @returns An array of strings that match the target.
	 */
	doSimpleSearch(target: string): string[] {
		this.log.debug("doSimpleSearch", target);
		if (!target || target.length < 2) return [];
		//fuzzySearch
		const lowerCaseInputStr = target.toLocaleLowerCase();
		const t = this.content.filter((content) =>
			content.toLocaleLowerCase().contains(lowerCaseInputStr)
		);
		return t;
	}

	/**
	 * Performs a fuzzy search for the target string within the content.
	 * @param target The string to search for.
	 * @param maxResults Maximum number of results to return.
	 * @param minScore Minimum score for a result to be included.
	 * @returns An array of strings that closely match the target.
	 */
	doFuzzySearch(target: string, maxResults = 20, minScore = -2): string[] {
		this.log.debug("doFuzzySearch", target);
		if (!target || target.length < 1) return [];
		const fuzzy = prepareFuzzySearch(target);
		// @ts-expect-error - original code
		const matches: [string, SearchResult][] = this.content.map((c) => [
			c,
			fuzzy(c),
		]);
		const goodMatches = matches.filter(
			(i) => i[1] && i[1]["score"] > minScore
		);
		goodMatches.sort((c) => c[1]["score"]);
		const ret = goodMatches.map((c) => c[0]);
		return ret.slice(0, maxResults);
	}

	/**
	 * Renders a suggestion in the HTML element provided.
	 * @param content The suggestion content to render.
	 * @param el The HTML element to render the suggestion in.
	 */
	renderSuggestion(content: string, el: HTMLElement): void {
		el.setText(content);
	}

	/**
	 * Handles the selection of a suggestion.
	 * @param content The selected suggestion content.
	 * @param evt The event associated with the selection.
	 */
	selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
		// this.log.debug("selectSuggestion", content, "Event:", evt);
		this.log.info("selectSuggestion", content);
		this.onSelectCb(content);
		// Check if element is a traditional input or textarea
		if (this.textEl instanceof HTMLInputElement) {
			this.log.debug("Handling as input or textarea");
			const [head, tail] = this.getParts(this.textEl.value);
			this.log.debug(`Got '${head}','${tail}' from `, this.textEl.value);
			if (head.length > 0)
				this.textEl.value = head + ", " + this.wrapContent(content);
			else this.textEl.value = this.wrapContent(content);
			this.textEl.dispatchEvent(new Event("change"));
			this.textEl.setSelectionRange(0, 1);
			this.textEl.setSelectionRange(
				this.textEl.value.length,
				this.textEl.value.length
			);
		} else if (this.textEl.isContentEditable) {
			this.log.debug("Handling as content editable");
			const currentContent = this.textEl.textContent || "";
			this.log.debug("Current input content:", currentContent);

			const [head, tail] = this.getParts(currentContent);
			this.log.debug(`Got '${head}', '${tail}' from `, currentContent);

			if (head.length > 0)
				this.textEl.textContent =
					head + ", " + this.wrapContent(content);
			else this.textEl.textContent = this.wrapContent(content);

			// Move cursor to the end of the content
			const range = document.createRange();
			const sel = window.getSelection();
			range.selectNodeContents(this.textEl);
			range.collapse(false);
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(range);
			}
			this.textEl.blur();
		} else {
			this.log.error("Element type not supported");
		}

		// this.textEl.focus();
		this.close();
	}

	/**
	 * Wraps the selected content in a specific format.
	 * @param content The content to wrap.
	 * @returns The wrapped content.
	 */
	wrapContent(content: string): string {
		return content;
	}

	/**
	 * Abstract method to get the content for suggestions.
	 * Must be implemented by subclasses.
	 * @returns An array of strings or a promise that resolves to an array of strings.
	 */
	abstract getContent(): string[] | Promise<string[]>;
}

/**
 * Suggest class for tags, extending AddTextSuggest.
 */
export class TagSuggest extends AddTextSuggest {
	getContent() {
		// @ts-expect-error - this is an undocumented function...
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tagMap: Map<string, any> = this.app.metadataCache.getTags();
		return Object.keys(tagMap).map((k) => k.replace("#", ""));
	}
}

/**
 * Suggest class for links, extending AddTextSuggest.
 */
export class LinkSuggest extends AddTextSuggest {
	getContent() {
		this.log.debug("LinkSuggest getContent");
		return this.app.vault
			.getFiles()
			.filter((f) => f.extension === "md")
			.map((f) => f.basename);
	}

	getSuggestions(inputStr: string): string[] {
		this.log.debug("LinkSuggest getSuggestions", inputStr);
		const target = this.getParts(inputStr)[1];
		const m = target.match(/\s*\[\[(.*)/); // Example regex: " [[a" -> ["a"]
		if (!m || m.length < 2 || m[1].length < 1) return [];
		this.log.debug(m);
		const newTarget = m[1];
		this.log.debug("Got newTarget ", newTarget, " from  ", target);
		return this.doFuzzySearch(newTarget);
	}

	wrapContent(content: string): string {
		return `[[${content}]]`;
	}
}

/**
 * Suggest class for custom fields, extending AddTextSuggest.
 */
export class FieldSuggest extends AddTextSuggest {
	/**
	 * Constructs an instance of FieldSuggest with additional field options.
	 * @param textEl The HTML input or div element to attach the suggest functionality.
	 * @param app The Obsidian app instance.
	 * @param onSelectCb Callback function to execute when a suggestion is selected.
	 * @param options Configuration options for field lookup and aliasing.
	 */
	constructor(
		textEl: HTMLInputElement | HTMLDivElement,
		app: App,
		plugin: MyPlugin,
		onSelectCb: (value: string) => void = (v) => v,
		private options: FieldOptions
	) {
		super(textEl, app, plugin, onSelectCb);
		// this.log.debug("FieldSuggest constructor", plugin);
		this.log.info("FieldSuggest constructor", options);
	}
	async getContent() {
		this.log.debug("FieldSuggest getContent, ", this.plugin);
		return this.plugin.proxy.api.dv
			.pages()
			.filter(
				(page) =>
					page[`${this.options?.lookup?.field}`] ==
					this.options?.lookup?.value
			)
			.map((page) =>
				this.options?.alias
					? (page[this.options.alias] as string)
					: page.file?.name
			)
			.array();
	}

	getSuggestions(inputStr: string): string[] {
		this.log.debug("LinkSuggest getSuggestions", inputStr);
		const target = this.getParts(inputStr)[1];
		// const m = target.match(/\s*\[\[(.*)/);
		const m = target.match(/(?:\[\[)?(.*)/s);
		if (!m || m.length < 2 || m[1].length < 1) {
			this.log.debug("No match");
			return [];
		}
		this.log.debug(m);
		const newTarget = m[1];
		this.log.debug("Got newTarget ", newTarget, " from  ", target);
		return this.doFuzzySearch(newTarget);
	}

	wrapContent(content: string): string {
		// const replacement =
		return `[[${content}]]`;
	}
}

/* Experiment towards making a UI that turns suggestions in to visually distinct elements
export class ContentEditableTest extends Modal {
    editDiv:HTMLDivElement

    async onOpen() {
		let {contentEl} = this; 
        contentEl.createEl("h4",{text:"ContentEditable"})
        this.editDiv = contentEl.createEl("div",{text:"Edit me"})
        this.editDiv.setAttribute("contenteditable","true")
        this.addElement("hello","from-template-text-completion-a")
        this.addElement("there","from-template-text-completion-b")
    }

    addElement(tx:string, cls:string) {
        const el = this.editDiv.createSpan(cls)
        el.setText(tx)
        const but = el.createEl("button")
        but.setText("X")
        but.onclick = () => el.detach()
    }
}
*/

export function ucFirst(s: string): string {
	return s[0].toUpperCase() + s.substring(1);
}
