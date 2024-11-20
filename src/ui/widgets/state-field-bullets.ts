/* eslint-disable @typescript-eslint/no-unused-vars */
import { syntaxTree } from "@codemirror/language";
import {
	type Extension,
	RangeSetBuilder,
	StateField,
	Transaction,
	StateEffect,
} from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	WidgetType,
} from "@codemirror/view";
import { EmojiWidget } from "./widget-emoji";

const emoji = StateEffect.define<string>();

export const bulletStateField = StateField.define<DecorationSet>({
	create(state): DecorationSet {
		return Decoration.none;
	},
	update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		syntaxTree(transaction.state).iterate({
			enter(node) {
				if (node.type.name.startsWith("list")) {
					const listCharFrom = node.from - 2;
					const listNodeBullet = transaction.state.doc.slice(
						listCharFrom,
						listCharFrom + 1
					);
					if (listNodeBullet.toString() === "-") {
						builder.add(
							listCharFrom,
							listCharFrom + 1,
							Decoration.replace({
								widget: new EmojiWidget("🔹"),
							})
						);
					}
				}
			},
		});

		return builder.finish();
	},

	provide(field: StateField<DecorationSet>): Extension {
		return EditorView.decorations.from(field);
	},
});
