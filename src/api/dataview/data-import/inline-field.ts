import type { Literal } from "obsidian-dataview";
import type { InlineField } from "@/ui/dataview/inline-field-live-preview";

// NOTE: This file is largely taken from the original Obsidian Dataview code. https://github.com/blacksmithgu/obsidian-dataview

/** Extracts inline fields of the form '[key:: value]' from a line of text. This is done in a relatively
 * "robust" way to avoid failing due to bad nesting or other interfering Markdown symbols:
 *
 * - Look for any wrappers ('[' and '(') in the line, trying to parse whatever comes after it as an inline key::.
 * - If successful, scan until you find a matching end bracket, and parse whatever remains as an inline value.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/** The wrapper characters that can be used to define an inline field. */
export const INLINE_FIELD_WRAPPERS: Readonly<Record<string, string>> =
	Object.freeze({
		"[": "]",
		"(": ")",
	});

export function extractInlineFields(
	line: string,
	includeTaskFields: boolean = false
): InlineField[] {
	// eslint-disable-next-line prefer-const
	let fields: InlineField[] = [];
	for (const wrapper of Object.keys(INLINE_FIELD_WRAPPERS)) {
		let foundIndex = line.indexOf(wrapper);
		while (foundIndex >= 0) {
			const parsedField = findSpecificInlineField(line, foundIndex);
			if (!parsedField) {
				foundIndex = line.indexOf(wrapper, foundIndex + 1);
				continue;
			}

			fields.push(parsedField);
			foundIndex = line.indexOf(wrapper, parsedField.end);
		}
	}

	if (includeTaskFields)
		fields = fields.concat(extractSpecialTaskFields(line));

	fields.sort((a, b) => a.start - b.start);

	// eslint-disable-next-line prefer-const
	let filteredFields: InlineField[] = [];
	for (let i = 0; i < fields.length; i++) {
		if (
			i == 0 ||
			filteredFields[filteredFields.length - 1].end < fields[i].start
		) {
			filteredFields.push(fields[i]);
		}
	}
	return filteredFields;
}

export const CREATED_DATE_REGEX = /\u{2795}\s*(\d{4}-\d{2}-\d{2})/u;
export const DUE_DATE_REGEX =
	/(?:\u{1F4C5}|\u{1F4C6}|\u{1F5D3}\u{FE0F}?)\s*(\d{4}-\d{2}-\d{2})/u;
export const DONE_DATE_REGEX = /\u{2705}\s*(\d{4}-\d{2}-\d{2})/u;
export const SCHEDULED_DATE_REGEX = /[\u{23F3}\u{231B}]\s*(\d{4}-\d{2}-\d{2})/u;
export const START_DATE_REGEX = /\u{1F6EB}\s*(\d{4}-\d{2}-\d{2})/u;

export const EMOJI_REGEXES = [
	{ regex: CREATED_DATE_REGEX, key: "created" },
	{ regex: START_DATE_REGEX, key: "start" },
	{ regex: SCHEDULED_DATE_REGEX, key: "scheduled" },
	{ regex: DUE_DATE_REGEX, key: "due" },
	{ regex: DONE_DATE_REGEX, key: "completion" },
];

/** Parse special completed/due/done task fields which are marked via emoji. */
function extractSpecialTaskFields(line: string): InlineField[] {
	const results: InlineField[] = [];

	for (const { regex, key } of EMOJI_REGEXES) {
		const match = regex.exec(line);
		if (!match) continue;

		results.push({
			key,
			value: match[1],
			start: match.index,
			startValue: match.index + 1,
			end: match.index + match[0].length,
			wrapping: "emoji-shorthand",
		});
	}

	return results;
}

/** Find the '::' separator in an inline field. */
function findSeparator(
	line: string,
	start: number
): { key: string; valueIndex: number } | undefined {
	const sep = line.indexOf("::", start);
	if (sep < 0) return undefined;

	return { key: line.substring(start, sep).trim(), valueIndex: sep + 2 };
}

/** Try to completely parse an inline field starting at the given position. Assuems `start` is on a wrapping character. */
function findSpecificInlineField(
	line: string,
	start: number
): InlineField | undefined {
	const open = line.charAt(start);

	const key = findSeparator(line, start + 1);
	if (key === undefined) return undefined;

	// Fail the match if we find any separator characters (not allowed in keys).
	for (const sep of Object.keys(INLINE_FIELD_WRAPPERS).concat(
		Object.values(INLINE_FIELD_WRAPPERS)
	)) {
		if (key.key.includes(sep)) return undefined;
	}

	const value = findClosing(
		line,
		key.valueIndex,
		open,
		INLINE_FIELD_WRAPPERS[open]
	);
	if (value === undefined) return undefined;

	return {
		key: key.key,
		value: value.value,
		start: start,
		startValue: key.valueIndex,
		end: value.endIndex,
		wrapping: open,
	};
}

/**
 * Find a matching closing bracket that occurs at or after `start`, respecting nesting and escapes. If found,
 * returns the value contained within and the string index after the end of the value.
 */
function findClosing(
	line: string,
	start: number,
	open: string,
	close: string
): { value: string; endIndex: number } | undefined {
	let nesting = 0;
	let escaped = false;
	for (let index = start; index < line.length; index++) {
		const char = line.charAt(index);

		// Allows for double escapes like '\\' to be rendered normally.
		if (char == "\\") {
			escaped = !escaped;
			continue;
		}

		// If escaped, ignore the next character for computing nesting, regardless of what it is.
		if (escaped) {
			escaped = false;
			continue;
		}

		if (char == open) nesting++;
		else if (char == close) nesting--;

		// Only occurs if we are on a close character and trhere is no more nesting.
		if (nesting < 0)
			return {
				value: line.substring(start, index).trim(),
				endIndex: index + 1,
			};

		escaped = false;
	}

	return undefined;
}

/** Parse a textual inline field value into something we can work with. */
export function parseInlineValue(value: string): Literal {
	// Empty inline values (i.e., no text) should map to null to match long-term Dataview semantics.
	// Null is also a more universal type to deal with than strings, since all functions accept nulls.
	if (value.trim() == "") return null;
	// The stripped literal field parser understands all of the non-array/non-object fields and can parse them for us.
	// Inline field objects are not currently supported; inline array objects have to be handled by the parser
	// separately.
	// let inline = EXPRESSION.inlineField.parse(value);
	// if (inline.status) return inline.value;
	else return value;
}
