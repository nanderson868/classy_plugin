/* eslint-disable @typescript-eslint/no-unused-vars */
import { syntaxTree } from "@codemirror/language";
import { type SyntaxNodeRef } from "@lezer/common";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	type PluginValue,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { debug } from "console";
import MyPlugin from "@/main";
import { Logger } from "@/utils/logging";

type Line = {
	from: number;
	to: number;
	level: number;
};

// const isDebug = false;
export const nestedListPlugin = (plugin: MyPlugin) =>
	ViewPlugin.fromClass(
		class NestedListPlugin implements PluginValue {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				debug("constructor");
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					plugin.settings
				) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			destroy() {}

			protected log: Logger = new Logger().setContext(this);

			buildDecorations(view: EditorView): DecorationSet {
				const rootTag = plugin.settings.discreteTag;
				if (!plugin.settings.enabled || !rootTag) {
					return Decoration.none;
				}

				let currLine: Line | null = null;
				let currRoot: Line | null = null;

				const builder = new RangeSetBuilder<Decoration>();

				const log = new Logger().setContext(
					this,
					this.buildDecorations
				);

				// eslint-disable-next-line prefer-const
				for (let { from, to } of view.visibleRanges) {
					syntaxTree(view.state).iterate({
						from,
						to,
						enter(node) {
							const line = view.state.sliceDoc(
								node.from,
								node.to
							);
							log.debug("---");

							debugNode("⬛️", currLine, currRoot);
							if (
								currLine &&
								currLine?.level == currRoot?.level
							) {
								debugNode("⏭️", currLine, currRoot, node.name);
								return false;
							}

							const nodeClasses = node.name.split("_");
							const lineClass = nodeClasses.find((cls) =>
								/^HyperMD-list-line-\d+$/.test(cls)
							);
							// Check for & update new line
							if (lineClass) {
								currLine = {
									to: node.to,
									from: node.from,
									level: parseInt(lineClass.split("-")[3]),
								};
							} else if (currLine == null) {
								debugNode("🔸", currLine, currRoot, node.name);
								return; // Skip node
							}
							// Check for & update new root
							else if (
								nodeClasses.some((cls) =>
									cls.startsWith(`tag-${rootTag}`)
								)
							) {
								currRoot = currLine;
							} else {
								debugNode("🔄", currLine, currRoot, line);
								return; // Skip node
							}
							// Check if current item is root / descends from a root
							if (
								currRoot &&
								(currLine == currRoot ||
									currLine.level > currRoot.level)
							) {
								// Decorate current item
								builder.add(
									currLine.from,
									currLine.to,
									Decoration.mark({
										inclusive: true,
										class: "classy-branch",
									})
								);
								debugNode("🔻", currLine, currRoot, line);
								return false; // Skip children
							} else {
								debugNode("🔹", currLine, currRoot, line);
								currRoot = null;
							}
							log.debug("?????");
						},
						leave(node) {
							if (currRoot) {
								currLine = null;
								debugNode("✅", currLine, currRoot);
							}
						},
					});
				}
				return builder.finish();
			}
		},
		{
			decorations: (instance) => instance.decorations,
		}
	);

const log = new Logger().setContext(__filename);

const debugLine = (
	line: string,
	currLine: Line | null = null,
	currRoot: Line | null = null
) => {
	const text =
		line.indexOf("]") > -1 ? line.slice(line.indexOf("]") + 1) : line;

	if (!currRoot) return;
	log.debug({}, `\n` + `${currRoot ? "🔸|" + currRoot.level + text : ""}`);
};

const debugNode = (
	emoji: string,
	currLine: Line | null,
	currRoot: Line | null,
	line = ""
) => {
	log.debug(
		{},
		[emoji, currRoot?.level || "-", currLine?.level || "-", line].join("|")
	);
};
