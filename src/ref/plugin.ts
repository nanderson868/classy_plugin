/* eslint-disable @typescript-eslint/no-unused-vars */
import { Editor, MarkdownView, Notice, TFile, TFolder, Plugin } from "obsidian";
import { SampleModal } from "@/ref/modal";
import moment from "moment";
import { add } from "@/ui/widgets/state-field-calc";

type ReferenceSettings = {
	editorMenuEnabled: boolean;
	dateFormat: string;
};

export abstract class SamplePlugin extends Plugin {
	settings!: ReferenceSettings;
	statusBarItem!: HTMLElement;
	clicks = 0;

	async onload() {
		// Command (Editor): Print file path
		this.addCommand({
			id: "print-file-path",
			name: "Print file path",
			editorCallback: (editor: Editor) => {
				new Notice(editor.getCursor().toString());
			},
		});

		// COMMANDS
		// Command: Open simple modal
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open simple modal",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});

		// Command (Editor): Replace selection
		this.addCommand({
			id: "sample-editor-command",
			name: "Replace selection",
			editorCallback: (
				editor: Editor
				// view: MarkdownView | MarkdownFileInfo
			) => {
				editor.replaceSelection("Editor command");
			},
		});

		// Command (Editor) (Markdown): Open complex modal
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open complex modal",
			checkCallback: (checking: boolean) => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// "checking" if the command can be run.
					if (!checking) {
						new SampleModal(this.app).open();
					}
					return true;
				}
			},
		});

		// Command (Editor): Insert today's date
		this.addCommand({
			id: "insert-todays-date",
			name: "Insert today's date",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					moment().format(this.settings.dateFormat),
					editor.getCursor()
				);
			},
		});

		// Command (Editor): Convert to uppercase
		this.addCommand({
			id: "convert-to-uppercase",
			name: "Convert to uppercase",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				editor.replaceSelection(selection.toUpperCase());
			},
		});

		// Command (Editor): Dispatch state effects directly on the editor view.
		this.addCommand({
			id: "example-editor-command-state-command",
			name: "Editor: state field calc)",
			editorCallback: (editor, view) => {
				console.log("command: state field calc...");
				//@ts-expect-error, not typed
				const editorView = view.editor.cm as EditorView;
				add(editorView, 1); // Using api from state-field-calc.ts
			},
		});

		// Register event (File menu): Menu item to print file path
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("Print file path 👈")
						.setIcon("document")
						.onClick(async () => {
							new Notice(file.path);
						});
				});
			})
		);

		// Register event (Editor Menu): Menu item to print file path
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				if (this.settings.editorMenuEnabled) {
					menu.addItem((item) => {
						item.setTitle("Print file path 👈")
							.setIcon("document")
							.onClick(async () => {
								if (view.file) {
									new Notice(view.file.path);
								}
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				console.log("event: css-change");
			})
		);

		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			this.clicks++;
		});

		// Status Bar Item: Example text
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.createEl("span", {
			text: "Hello from the status bar",
		});
		this.addRibbonIcon(
			"info",
			"Calculate average file length",
			async () => {
				const fileLength = await this.averageFileLength();
				const message = `File count: ${await this.fileCount()}\nAverage length: ${fileLength} characters\nClicks: ${
					this.clicks
				}`;
				new Notice(message);
			}
		);

		// Register Interval: Update status bar items
		this.registerInterval(
			window.setInterval(
				() => this.statusBarItem.setText(moment().format("H:mm:ss")),
				1000
			)
		);
	}

	async isFile(path: string) {
		const folderOrFile = this.app.vault.getAbstractFileByPath(path);

		if (folderOrFile instanceof TFile) {
			console.log("It's a file!");
		} else if (folderOrFile instanceof TFolder) {
			console.log("It's a folder!");
		}
	}

	async averageFileLength(): Promise<number> {
		const { vault } = this.app;

		const fileContents: string[] = await Promise.all(
			vault.getMarkdownFiles().map((file) => vault.cachedRead(file))
		);

		let totalLength = 0;
		fileContents.forEach((content) => {
			totalLength += content.length;
		});

		return Math.round(totalLength / fileContents.length);
	}

	async fileCount(): Promise<number> {
		const { vault } = this.app;
		return vault.getMarkdownFiles().length;
	}
}
