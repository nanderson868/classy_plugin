/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	StateField,
	Transaction,
	EditorState,
	StateEffect,
} from "@codemirror/state";

import { EditorView } from "@codemirror/view";

const addEffect = StateEffect.define<number>();
const subtractEffect = StateEffect.define<number>();
const resetEffect = StateEffect.define();

export const calculatorField = StateField.define<number>({
	create(state: EditorState): number {
		return 0;
	},
	update(oldState: number, transaction: Transaction): number {
		let newState = oldState;

		for (const effect of transaction.effects) {
			if (effect.is(addEffect)) {
				newState += effect.value;
			} else if (effect.is(subtractEffect)) {
				newState -= effect.value;
			} else if (effect.is(resetEffect)) {
				newState = 0;
			}
		}

		return newState;
	},
});

export function add(view: EditorView, num: number) {
	view.dispatch({
		effects: [addEffect.of(num)],
	});
}

export function subtract(view: EditorView, num: number) {
	view.dispatch({
		effects: [subtractEffect.of(num)],
	});
}

export function reset(view: EditorView) {
	view.dispatch({
		effects: [resetEffect.of(null)],
	});
}
