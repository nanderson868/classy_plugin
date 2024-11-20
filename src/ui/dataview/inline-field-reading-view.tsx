// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { parseInlineValue } from "@/../../"
// import * as Values from "../../data-model/values";
import {
	type MarkdownPostProcessorContext,
	MarkdownRenderChild,
} from "obsidian";
// import { render } from "preact";
// import { DataviewContext, type DataviewInit, Lit } from "../markdown";
import { type DataviewInit } from "../markdown";

import { extractInlineFields } from "../../data-import/inline-field";
import type { InlineField } from "./inline-field-live-preview";
// import React from "preact/compat";

/** Replaces raw textual inline fields in text containers with pretty HTML equivalents. */
export async function replaceInlineFields(
	ctx: MarkdownPostProcessorContext,
	init: DataviewInit
): Promise<void> {
	const inlineFields = extractInlineFields(init.container.innerHTML);
	if (inlineFields.length == 0) return;

	const text = ctx.getSectionInfo(init.container)?.text;
	let inlineFieldsFromText: InlineField[] | null = null;
	if (text) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		inlineFieldsFromText = extractInlineFields(text);
	}

	const component = new MarkdownRenderChild(init.container);
	ctx.addChild(component);

	// Iterate through the raw HTML and replace inline field matches with corresponding rendered values.
	let result = init.container.innerHTML;
	for (let x = inlineFields.length - 1; x >= 0; x--) {
		const field = inlineFields[x];
		const renderContainer = document.createElement("span");
		renderContainer.addClasses(["dataview", "inline-field"]);

		// Block inline fields render the key, parenthesis ones do not.
		if (field.wrapping == "[") {
			const key = renderContainer.createSpan({
				cls: ["dataview", "inline-field-key"],
				attr: {
					"data-dv-key": field.key,
					// "data-dv-norm-key": canonicalizeVarName(field.key),
				},
			});

			// Explicitly set the inner HTML to respect any key formatting that we should carry over.
			key.innerHTML = field.key;

			renderContainer.createSpan({
				cls: ["dataview", "inline-field-value"],
				attr: { id: "dataview-inline-field-" + x },
			});
		} else {
			renderContainer.createSpan({
				cls: ["dataview", "inline-field-standalone-value"],
				attr: { id: "dataview-inline-field-" + x },
			});
		}

		result =
			result.slice(0, field.start) +
			renderContainer.outerHTML +
			result.slice(field.end);
	}

	// Use a <template> block to render this HTML properly to nodes.
	const template = document.createElement("template");
	template.innerHTML = result;

	// Replace the container children with the new rendered children.
	// TODO: Replace this with a dom-to-dom diff to reduce the actual amount of updates.
	// init.container.replaceChildren(...Array.from(template.content.childNodes));

	// for (let index = 0; index < inlineFields.length; index++) {
	// 	const box = init.container.querySelector(
	// 		"#dataview-inline-field-" + index
	// 	);
	// 	if (!box) continue;

	// 	const context = Object.assign({}, init, {
	// 		container: box,
	// 		component: component,
	// 	});

	// 	let parsedValue;
	// 	if (
	// 		inlineFieldsFromText &&
	// 		inlineFieldsFromText[index].key == inlineFields[index].key
	// 	) {
	// 		const parsedValueFromText = parseInlineValue(
	// 			inlineFieldsFromText[index].value
	// 		);
	// 		if (Values.isString(parsedValueFromText)) {
	// 			parsedValue = parsedValueFromText;
	// 		}
	// 	}
	// 	if (parsedValue === undefined) {
	// 		parsedValue = parseInlineValue(inlineFields[index].value);
	// 	}

	// 	render(
	// 		<DataviewContext.Provider value={context}>
	// 			<Lit
	// 				value={parsedValue}
	// 				inline={true}
	// 				sourcePath={ctx.sourcePath}
	// 			/>
	// 		</DataviewContext.Provider>,
	// 		box
	// 	);
	// }
}
