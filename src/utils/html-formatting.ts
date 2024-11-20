import moment from "moment";
import { wrapperCls, keySpanCls, valueSpanCls } from "./html-fields";

/**
//  * Formats field values based on the key and value
//  * @param key
//  */
export function formatKey(key: string, value: string) {
	// Format dates
	if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		return moment(value).format("MMM D, YYYY");
	}
}

export function textFieldsToMarkdown(text: string): string {
	const regex = /\[([^\]]+):: ([^\]]+)\]/g;
	return text.replace(regex, (match, keyStr, valueStr) => {
		const key = keyStr.trim();
		const value = valueStr.trim();
		const wrapperCLS = wrapperCls;
		const keyHTML = `<span class="${keySpanCls}">${key}</span>`;
		const valueHTML = `<span class="${valueSpanCls}">${formatKey(
			key,
			value
		)}</span>`;
		const wrapperHTML = `<span class="${wrapperCLS} ${keySpanCls}-${key} ${valueSpanCls}-${value}">${keyHTML}${valueHTML}</span>`;
		return wrapperHTML;
	});
}

export function triggerFlashEffect(element: HTMLElement) {
	element.classList.add("flash-effect");

	// Automatically remove the class after the animation duration (500ms)
	setTimeout(() => {
		element.classList.remove("flash-effect");
	}, 500); // This duration should match the animation-duration in CSS
}
