import assertNever from "assert-never";
import MyPlugin from "@/main";
import MySettings from "@/settings";
import NothingSelected from "@/settings";
import {
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	type EditorPosition,
	type EditorRange,
} from "obsidian";
import { isRegExp } from "util/types";
import { Logger } from "@/utils/logging";
import TransformationSettings from "@/settings/transformations";

const log = new Logger().setContext(__filename);

const win32Path = /^[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/i;
const unixPath = /^(?:\/[^/]+)+\/?$/i;
const testFilePath = (url: string) => win32Path.test(url) || unixPath.test(url);

type TransformationRule = {
	name: string;
	pattern: string;
	replacement: string;
	icon: string;
	enabled: boolean;
	color?: string;
	for: "field" | "link";
	use: "icon" | "name" | "both";
};

type Settings = {
	transformations: TransformationRule[];
	nothingSelected: NothingSelected;
	listForImgEmbed: string;
};

const DEFAULT_SETTINGS = {
	nothingSelected: NothingSelected.doNothing,
	listForImgEmbed: "",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_TRANSFORMATION_RULE: TransformationRule = {
	name: "",
	pattern: "",
	replacement: "",
	icon: "",
	enabled: true,
	for: "link",
	use: "icon",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TSettings = object;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class PasteHandler {
	settings = new TransformationSettings(DEFAULT_SETTINGS);
	constructor(private plugin: MyPlugin) {}

	async handlePaste(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		cb: ClipboardEvent,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		editor: Editor,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		info: MarkdownView | MarkdownFileInfo
	) {}
}

export async function HandleEditorPaste(
	plugin: MyPlugin,
	cb: ClipboardEvent,
	editor: Editor,
	info: MarkdownView | MarkdownFileInfo
): Promise<unknown> {
	log.info({}, "clipboard event: ", cb);
	if (cb.defaultPrevented) return cb;
	let selectedText: string = "";
	let replacementText: string | null = null;
	let replaceRange: EditorRange | null = null;

	const file = info.file;
	const fileCache = file && plugin.app.metadataCache.getFileCache(file);
	const cursor = editor.getCursor();
	const section = fileCache?.sections?.find((section) => {
		const { start, end } = section.position;
		return cursor.line >= start.line && cursor.line <= end.line;
	});
	const line = editor.getLine(cursor.line);
	log.debug({}, "handling paste", { cb, file, section, line });
	switch (section?.type) {
		case "code": {
			const plainText =
				cb instanceof ClipboardEvent &&
				cb.clipboardData?.getData("text/plain");
			// const plainText = await navigator.clipboard.readText();
			if (!plainText) return;
			replaceRange = getCursor(editor);
			replacementText = plainText;
			// editor.replaceRange(plainText, cursor);
			break;
		}
		default: {
			const clipboardText = getCbText(cb);
			if (!clipboardText) return;
			({ selectedText, replaceRange } = getSelnRange(editor, plugin));
			replacementText = await getReplacementText(
				clipboardText,
				selectedText,
				plugin
			);
			log.debug(
				{},
				`clipboard text: '${clipboardText}'\nselected text: '${selectedText}'\nreplacement text: '${replacementText}'`
			);
			if (
				!editor.somethingSelected() &&
				plugin.settings.nothingSelected === NothingSelected.doNothing
			) {
				return;
			}
			break;
		}
	}

	if (!replacementText) return; // exit early
	if (typeof cb !== "string") {
		cb.preventDefault();
	} else {
		log.debug({}, "clipboard event is string. Not preventing default");
	}
	replace(editor, replacementText, replaceRange);

	if (
		selectedText === "" &&
		plugin.settings.nothingSelected === NothingSelected.insertInline &&
		replaceRange
	) {
		log.debug({}, "placing cursor between brackets");
		const offset = replacementText.indexOf("]") !== -1 ? 1 : 0;
		editor.setCursor({
			ch: replaceRange.from.ch + offset,
			line: replaceRange.from.line,
		});
	}
}

/**
 * This function determines the selected text and, if no selection, the range to replace
 * @param editor
 * @param plugin
 * @returns
 */
function getSelnRange(editor: Editor, plugin: MyPlugin) {
	let selectedText: string;
	let replaceRange: EditorRange | null = null;

	// check for selected text
	if (editor.somethingSelected()) {
		selectedText = editor.getSelection().trim();
	} else {
		// set selected text and range based on nothing selected behavior
		const nothingSelected = plugin.settings.nothingSelected;
		switch (nothingSelected) {
			case NothingSelected.autoSelect:
				// get word boundaries
				log.debug({}, "auto selecting word");
				replaceRange = getWordBoundaries(editor, plugin.settings);
				selectedText = editor.getRange(
					replaceRange.from,
					replaceRange.to
				);
				break;
			case NothingSelected.insertInline:
			case NothingSelected.insertBare:
				// get cursor position
				log.debug({}, "inserting at cursor");
				replaceRange = getCursor(editor);
				selectedText = "";
				break;
			case NothingSelected.doNothing:
				throw new Error("should be skipped!");
			default:
				assertNever(nothingSelected);
		}
	}
	return { selectedText, replaceRange };
}

/**
 * Test if the text is a valid URL.
 * @param text
 * @param settings
 * @returns
 */
function isUrl(text: string, settings: MySettings): boolean {
	if (text === "") return false;
	try {
		// throw TypeError: Invalid URL if not valid
		const newUrl = new URL(text);
		log.debug({}, "valid URL: ", newUrl);
		return true;
	} catch (error) {
		// settings.regex: fallback test allows url without protocol (http,file...)
		return testFilePath(text) || new RegExp(settings.regex).test(text);
	}
}

/**
 * Test if the text is an image embed.
 * @param text
 * @param settings
 * @returns
 */
function isImgEmbed(text: string, settings: MySettings): boolean {
	const rules = settings.listForImgEmbed
		.split("\n")
		.filter((v) => v.length > 0)
		.map((v) => new RegExp(v));
	for (const reg of rules) {
		if (reg.test(text)) return true;
	}
	return false;
}

/**
 * Process the clipboard text and the selected text to determine the markdown link to be inserted.
 * @param clipboardText text on the clipboard.
 * @param selectedText highlighted text
 * @param settings plugin settings
 * @returns a mardown link or image link if the clipboard or selction value is a valid link, else null.
 */
async function getReplacementText(
	clipboardText: string,
	selectedText: string,
	plugin: MyPlugin
): Promise<string | null> {
	let { linkText, link } = applyRegex(clipboardText, plugin);

	// Check for regex or URL match
	if (linkText || link) {
		linkText = linkText || selectedText;
		link = link || clipboardText;
	} else if (isUrl(clipboardText, plugin.settings)) {
		linkText = selectedText;
		link = clipboardText;
	} else if (isUrl(selectedText, plugin.settings)) {
		linkText = clipboardText;
		link = selectedText;
	} else return null; // exit early

	link = await processUrl(link);

	// check if the URL should be embedded as an image
	const imgEmbedMark = isImgEmbed(clipboardText, plugin.settings) ? "!" : "";

	if (
		linkText === "" &&
		plugin.settings.nothingSelected === NothingSelected.insertBare
	) {
		return `<${link}>`;
	}
	return imgEmbedMark + `[${linkText}](${link})`;
}

/**
 * Apply the first matching transformation and exit
 */
function applyRegex(clipboardText: string, plugin: MyPlugin) {
	// let linkText = selectedText;
	let link: string | null = null;
	let linkText: string | null = null;
	const transformations = plugin.settings.transformations.filter(
		(t) => t.enabled && t.pattern !== ""
	);
	log.debug({}, "transformations: ", transformations);
	for (const rule of transformations) {
		const pattern_regex = new RegExp(rule.pattern);
		if (!isRegExp(pattern_regex)) {
			log.error("transformation pattern not regex: ", pattern_regex);
			break;
		}
		if (pattern_regex.test(clipboardText)) {
			log.debug({}, "transformation rule matched: ", rule);
			linkText = rule.icon;
			link = clipboardText.replace(pattern_regex, rule.replacement);
		}
	}
	return { linkText, link };
}

/** Process file url, special characters, etc, with additional URL transformations */
async function processUrl(url: string): Promise<string> {
	// Handle file paths
	if (testFilePath(url)) {
		const fileUrl = await import("file-url");
		url = fileUrl.default(url, { resolve: false });
		log.debug({}, "detected file path -> converted URL: ", url);
	}

	// Encode special characters
	if (/[<>]/.test(url)) {
		url = url.replace("<", "%3C").replace(">", "%3E");
		log.debug({}, "detected special characters -> encoded url: ", url);
	}
	// eslint-disable-next-line no-useless-escape
	if (/[\(\) ]/.test(url)) {
		url = `<${url}>`;
		log.debug({}, "parentheses or spaces detected -> encoded url: ", url);
	}
	return url;
}

function getCbText(cb: string | ClipboardEvent): string | null {
	let text: string;

	if (typeof cb === "string") {
		text = cb;
	} else {
		if (cb.clipboardData === null) {
			return null;
		} else {
			text = cb.clipboardData.getData("text");
		}
	}
	text = text.trim();
	return text;
}

function getWordBoundaries(editor: Editor, settings: MySettings): EditorRange {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	// eslint-disable-next-line prefer-const
	let wordBoundaries = findWordAt(line, cursor);
	log.debug({}, "word boundaries: ", wordBoundaries);

	// If the token the cursor is on is a url, grab the whole thing instead of just parsing it like a word
	let start = wordBoundaries.from.ch;
	let end = wordBoundaries.to.ch;
	while (start > 0 && !/\s/.test(line.charAt(start - 1))) --start;
	while (end < line.length && !/\s/.test(line.charAt(end))) ++end;
	if (isUrl(line.slice(start, end), settings)) {
		wordBoundaries.from.ch = start;
		wordBoundaries.to.ch = end;
		log.debug(
			{},
			"URL detected at cursor -> expanded word boundaries: ",
			wordBoundaries
		);
	}
	return wordBoundaries;
}

const findWordAt = (() => {
	const nonASCIISingleCaseWordChar =
		/[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;

	function isWordChar(char: string) {
		return (
			/\w/.test(char) ||
			(char > "\x80" &&
				(char.toUpperCase() != char.toLowerCase() ||
					nonASCIISingleCaseWordChar.test(char)))
		);
	}

	return (line: string, pos: EditorPosition): EditorRange => {
		let check;
		let start = pos.ch;
		let end = pos.ch;
		end === line.length ? --start : ++end;
		const startChar = line.charAt(pos.ch);
		if (isWordChar(startChar)) {
			check = (ch: string) => isWordChar(ch);
		} else if (/\s/.test(startChar)) {
			check = (ch: string) => /\s/.test(ch);
		} else {
			check = (ch: string) => !/\s/.test(ch) && !isWordChar(ch);
		}

		while (start > 0 && check(line.charAt(start - 1))) --start;
		while (end < line.length && check(line.charAt(end))) ++end;
		return {
			from: { line: pos.line, ch: start },
			to: { line: pos.line, ch: end },
		};
	};
})();

function getCursor(editor: Editor): EditorRange {
	return { from: editor.getCursor(), to: editor.getCursor() };
}

function replace(
	editor: Editor,
	replacementText: string,
	replaceRange: EditorRange | null = null
): void {
	// replaceRange is only not null when there isn't anything selected.
	if (replaceRange) {
		editor.replaceRange(
			replacementText,
			replaceRange.from,
			replaceRange.to
		);
	} else {
		editor.replaceSelection(replacementText);
	}
}
