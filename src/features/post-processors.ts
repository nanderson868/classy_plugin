/* eslint-disable @typescript-eslint/no-unused-vars */
// EDITOR EXTENSIONS:
// Reading mode emoji replacement

import MyPlugin from "@/main";
import ALL_EMOJIS from "@/utils/mixins/mixins";
import { MarkdownPostProcessorContext } from "obsidian";
import { Logger } from "@/utils/logging";

// eslint-disable-next-line @typescript-eslint/no-unused-vars

export class ViewPluginControl {
	protected log = new Logger().setContext(this);
	constructor(private plugin: MyPlugin) {}

	activate() {
		this.plugin.registerMarkdownPostProcessor((element, context) => {
			this.emojiReplacer(element, context);
			this.addClasses(element, context);
		});
	}

	emojiReplacer(element: HTMLElement, context: MarkdownPostProcessorContext) {
		const codeblocks = element.findAll("code");
		for (const codeblock of codeblocks) {
			const text = codeblock.innerText.trim();
			if (text[0] === ":" && text[text.length - 1] === ":") {
				const emojiEl = codeblock.createSpan({
					text: ALL_EMOJIS[text] ?? text,
				});
				codeblock.replaceWith(emojiEl);
			}
		}
	}

	addClasses(element: HTMLElement, context: MarkdownPostProcessorContext) {
		const items = element.findAll(".classy-content a.tag");
		for (const item of items) {
			item.setAttribute(
				"href",
				`obsidian://search?query=tag:%23${item.textContent?.slice(1)}`
			);
			item.addClass("classy-tag");
		}
	}
}
