/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	EditorView,
	WidgetType,
	Decoration,
	type DecorationSet,
} from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { type Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

export class EmojiWidget extends WidgetType {
	emoji: string;
	constructor(emoji: string) {
		super();
		this.emoji = emoji;
	}
	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");
		div.innerText = this.emoji;
		return div;
	}
}

export class EmojiWidget2 extends WidgetType {
	emoji: string;
	constructor(emoji: string) {
		super();
		this.emoji = emoji;
	}
	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");
		div.innerText = this.emoji;
		return div;
	}
}

export class EmojiWidget3 extends WidgetType {
	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");
		div.innerText = "☑️";
		return div;
	}
}

// Decoration:
// const decoration = Decoration.replace({
// 	widget: new EmojiWidget(),
// });
