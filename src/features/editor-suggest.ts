/* eslint-disable @typescript-eslint/no-unused-vars */
import MyPlugin from "@/main";
import type {
	Editor,
	EditorPosition,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	SearchResult,
	TFile,
	App,
} from "obsidian";
import { prepareFuzzySearch, EditorSuggest } from "obsidian";
import { Logger } from "@/utils/logging";

const pattern = /^\s*>\s*:(\w*)$/;
// const pattern = /^\[\[(\w+)\]\]$/;
// const pattern = /^\[\[([\w\s]+).*$/;

interface Result extends SearchResult {
	field: string;
	query: string;
}

type FieldSetting = {
	field: string;
};

const settings: FieldSetting[] = [];

/**
 * Provide suggestions for note fields based on user input in Obsidian editor.
 * Utilizes the Dataview API to fetch page names as suggestions.
 */
export class SmartEditorSuggest extends EditorSuggest<Result> {
	settings: FieldSetting[] = [];
	protected log = new Logger().setContext(this);
	constructor(public app: App, public plugin: MyPlugin) {
		super(app);
	}
	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null
	): EditorSuggestTriggerInfo | null {
		this.log.debug("onTrigger...");

		const start = { line: cursor.line, ch: 0 },
			beforeCursor = editor.getRange(start, cursor);

		if (!pattern.test(beforeCursor)) return null;
		const [, keyword] = beforeCursor.match(pattern)!;

		return {
			start,
			end: cursor,
			query: keyword,
		};
	}

	async getSuggestions(context: EditorSuggestContext): Promise<Result[]> {
		this.log.debug("getSuggestions...");
		const { query } = context;
		if (!query) return [];

		const options = this.plugin.proxy.api.dv
			.pages()
			.map((page) => page.file?.name)
			.array() as string[];
		this.log.debug("options: ", options);

		const search = prepareFuzzySearch(query);
		const searchResults: Result[] = options.flatMap((option: string) => {
			this.log.debug("getSuggestions option", option);
			const query = option;
			const result = search(query);
			if (!result) return [];
			return [{ field: query, query, ...result }];
		});
		this.log.debug("searchResults: ", searchResults);
		return searchResults.sort((a, b) => b.score - a.score);
	}
	selectSuggestion(
		{ field }: Result,
		_evt: MouseEvent | KeyboardEvent
	): void {
		this.log.debug("selectSuggestion field:", field);
		if (!this.context) {
			this.log.error(
				"No context available in NoteFieldsSuggest when selecting suggestion"
			);
			return;
		}
		const { start, end, editor } = this.context;

		// const template = this.plugin.getTemplate(field);
		// if (!template) {
		// 	this.log.error("No template found for field", field);
		// 	return;
		// }
		// const toInsert = Eta.render(template, { field }) as string;
		const toInsert = `>${field}:`;
		editor.replaceRange(toInsert, start, end);
	}

	renderSuggestion({ query, matches }: Result, el: HTMLElement): void {
		// this.log.debug("renderSuggestion query:", query);
		// this.log.debug("matches type", typeof matches);
		this.log.info("matches", matches);

		let offset = 0;
		for (const [start, end] of matches) {
			if (offset < start) {
				el.appendText(query.slice(offset, start));
			}
			el.createSpan({
				text: query.slice(start, end),
				cls: "suggestion-highlight",
			});
			offset = end;
		}
		if (offset < query.length) {
			el.appendText(query.slice(offset));
		}
	}
}
