import {
	App,
	Component,
	TFile,
	editorInfoField,
	editorLivePreviewField,
} from "obsidian";
import {
	EditorState,
	RangeSet,
	RangeSetBuilder,
	RangeValue,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	type PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import {
	extractInlineFields,
	parseInlineValue,
} from "@/api/dataview/data-import/inline-field";
import { renderCompactMarkdown, renderValue } from "@/ui/dataview/render";
import type { MySettings } from "@/settings/index";
import { selectionAndRangeOverlap } from "./lp-render";
import { Logger } from "@/utils/logging";

const log = new Logger();

class InlineFieldValue extends RangeValue {
	constructor(public field: InlineField) {
		super();
		log.setContext(this);
	}

	eq(other: InlineFieldValue): boolean {
		return (
			this.field.key == other.field.key &&
			this.field.value == other.field.value
		);
	}
}

function buildInlineFields(state: EditorState): RangeSet<InlineFieldValue> {
	const builder = new RangeSetBuilder<InlineFieldValue>();
	const tree = syntaxTree(state);

	for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
		const line = state.doc.line(lineNumber);
		let isInsideCodeBlock = false;
		tree.iterate({
			from: line.from,
			to: line.to,
			enter: (node) => {
				// ignore code blocks
				if (node.name.startsWith("HyperMD-codeblock")) {
					isInsideCodeBlock = true;
				}
				return node.name == "Document";
			},
		});
		if (!isInsideCodeBlock) {
			const inlineFields = extractInlineFields(line.text);
			for (const field of inlineFields) {
				log.debug({}, { key: field.key, value: field.value });
				builder.add(
					line.from + field.start,
					line.from + field.end,
					new InlineFieldValue(field)
				);
			}
		}
	}
	return builder.finish();
}

/** A parsed inline field. */
export interface InlineField {
	/** The raw parsed key. */
	key: string;
	/** The raw value of the field. */
	value: string;
	/** The start column of the field. */
	start: number;
	/** The start column of the *value* for the field. */
	startValue: number;
	/** The end column of the field. */
	end: number;
	/** If this inline field was defined via a wrapping ('[' or '('), then the wrapping that was used. */
	wrapping?: string;
}

/** A state field that stores the inline fields and their positions as a range set. */
export const inlineFieldsField = StateField.define<RangeSet<InlineFieldValue>>({
	create: buildInlineFields,
	update(oldFields, tr) {
		return tr.docChanged ? buildInlineFields(tr.state) : oldFields;
	},
});

/** Create a view plugin that renders inline fields in live preview just as in the reading view. */
export const replaceInlineFieldsInLivePreview = (
	app: App,
	settings: MySettings
) =>
	ViewPlugin.fromClass(
		class implements PluginValue {
			decorations: DecorationSet;
			component: Component;

			constructor(view: EditorView) {
				this.component = new Component();
				this.component.load();
				this.decorations = this.buildDecorations(view);
			}

			destroy() {
				this.component.unload();
			}

			buildDecorations(view: EditorView): DecorationSet {
				log.debug(
					{},
					"Building decorations for inline fields in live preview"
				);
				// Disable in the source mode
				if (!view.state.field(editorLivePreviewField)) {
					log.debug({}, "editorLivePreviewField not found");
					return Decoration.none;
				}

				const file = view.state.field(editorInfoField).file;
				if (!file) return Decoration.none;

				const info = view.state.field(inlineFieldsField);
				const builder = new RangeSetBuilder<Decoration>();
				const selection = view.state.selection;

				log.debug({}, "Building decorations...");
				for (const { from, to } of view.visibleRanges) {
					info.between(from, to, (start, end, { field }) => {
						// If the inline field is not overlapping with the cursor, we replace it with a widget.
						if (!selectionAndRangeOverlap(selection, start, end)) {
							builder.add(
								start,
								end,
								Decoration.replace({
									widget: new InlineFieldWidget(
										app,
										field,
										file.path,
										this.component,
										settings,
										view
									),
								})
							);
						}
					});
				}
				return builder.finish();
			}

			update(update: ViewUpdate) {
				// only activate in LP and not source mode
				if (!update.state.field(editorLivePreviewField)) {
					this.decorations = Decoration.none;
					return;
				}
				const layoutChanged = update.transactions.some((transaction) =>
					transaction.effects.some((effect) =>
						effect.is(workspaceLayoutChangeEffect)
					)
				);
				if (update.docChanged) {
					this.decorations = this.decorations.map(update.changes);
					this.updateDecorations(update.view);
				} else if (update.selectionSet) {
					this.updateDecorations(update.view);
				} else if (update.viewportChanged || layoutChanged) {
					log.debug({}, "Viewport changed or layout changed");
					this.decorations = this.buildDecorations(update.view);
				}
			}

			updateDecorations(view: EditorView) {
				const file = view.state.field(editorInfoField).file;
				if (!file) {
					this.decorations = Decoration.none;
					return;
				}

				const inlineFields = view.state.field(inlineFieldsField);
				const selection = view.state.selection;

				// log.debug({}, "View visible ranges: ", view.visibleRanges.length);
				for (const { from, to } of view.visibleRanges) {
					// log.debug({}, "Checking visible range: ", from, to);
					inlineFields.between(from, to, (start, end, { field }) => {
						const overlap = selectionAndRangeOverlap(
							selection,
							start,
							end
						);
						if (overlap) {
							// log.debug({}, "Overlapping with selection");
							this.removeDeco(start, end);
							return;
						} else {
							// log.debug({}, "Adding decoration");
							this.addDeco(start, end, field, file, view);
						}
					});
				}
			}

			removeDeco(start: number, end: number) {
				this.decorations.between(start, end, (from, to) => {
					this.decorations = this.decorations.update({
						filterFrom: from,
						filterTo: to,
						filter: () => false,
					});
				});
			}

			addDeco(
				start: number,
				end: number,
				field: InlineField,
				file: TFile,
				view: EditorView
			) {
				let exists = false;
				this.decorations.between(start, end, () => {
					exists = true;
				});
				if (!exists) {
					this.decorations = this.decorations.update({
						add: [
							{
								from: start,
								to: end,
								value: Decoration.replace({
									widget: new InlineFieldWidget(
										app,
										field,
										file.path,
										this.component,
										settings,
										view
									),
								}),
							},
						],
					});
				}
			}
		},
		{
			decorations: (instance) => instance.decorations,
		}
	);

/** A widget which inline fields are replaced with. */
class InlineFieldWidget extends WidgetType {
	constructor(
		public app: App,
		public field: InlineField,
		public sourcePath: string,
		public component: Component,
		public settings: MySettings,
		public view: EditorView
	) {
		super();
	}

	eq(other: InlineFieldWidget): boolean {
		return (
			this.field.key == other.field.key &&
			this.field.value == other.field.value
		);
	}

	toDOM() {
		// A large part of this method was taken from replaceInlineFields() in src/ui/views/inline-field.tsx.
		// It will be better to extract the common part as a function...

		const renderContainer = createSpan({
			cls: ["dataview", "inline-field"],
		});

		// Block inline fields render the key, parenthesis ones do not.
		if (this.field.wrapping == "[") {
			const key = renderContainer.createSpan({
				cls: ["dataview", "inline-field-key"],
				attr: {
					"data-dv-key": this.field.key,
					"data-dv-value": this.field.value,
				},
			});

			renderCompactMarkdown(
				this.app,
				this.field.key,
				key,
				this.sourcePath,
				this.component,
				true
			);

			const value = renderContainer.createSpan({
				cls: ["dataview", "inline-field-value"],
			});

			renderValue(
				this.app,
				parseInlineValue(this.field.value),
				value,
				this.sourcePath,
				this.component,
				this.settings,
				false,
				undefined,
				undefined,
				true
			);

			this.addKeyClickHandler(key, renderContainer);
			this.addValueClickHandler(value, renderContainer);
		} else {
			const value = renderContainer.createSpan({
				cls: ["dataview", "inline-field-standalone-value"],
			});
			renderValue(
				this.app,
				parseInlineValue(this.field.value),
				value,
				this.sourcePath,
				this.component,
				this.settings,
				false,
				undefined,
				undefined,
				true
			);
			this.addValueClickHandler(value, renderContainer);
		}

		return renderContainer;
	}

	// https://github.com/blacksmithgu/obsidian-dataview/issues/2101
	// When the user clicks on a rendered inline field, move the cursor to the clicked position.
	addKeyClickHandler(key: HTMLElement, renderContainer: HTMLElement) {
		key.addEventListener("click", (event) => {
			if (event instanceof MouseEvent) {
				const rect = key.getBoundingClientRect();
				const relativePos = (event.x - rect.x) / rect.width;
				const startPos = this.view.posAtCoords(
					renderContainer.getBoundingClientRect(),
					false
				);
				const clickedPos = Math.round(
					startPos +
						(this.field.startValue - 2 - this.field.start) *
							relativePos
				); // 2 is the length of "::"
				this.view.dispatch({ selection: { anchor: clickedPos } });
			}
		});
	}

	addValueClickHandler(value: HTMLElement, renderContainer: HTMLElement) {
		value.addEventListener("click", (event) => {
			if (event instanceof MouseEvent) {
				const rect = value.getBoundingClientRect();
				const relativePos = (event.x - rect.x) / rect.width;
				const startPos = this.view.posAtCoords(
					renderContainer.getBoundingClientRect(),
					false
				);
				const clickedPos = Math.round(
					startPos +
						(this.field.startValue - this.field.start) +
						(this.field.end - this.field.startValue) * relativePos
				);
				this.view.dispatch({ selection: { anchor: clickedPos } });
			}
		});
	}
}

/**
 * A state effect that represents the workspace's layout change.
 * Mainly intended to detect when the user switches between live preview and source mode.
 */
export const workspaceLayoutChangeEffect = StateEffect.define<null>();
