import {
	App,
	Notice,
	Setting,
	TextComponent,
	ColorComponent,
	ButtonComponent,
	Modal,
	MarkdownRenderer,
	TextAreaComponent,
} from "obsidian";
import { BaseSettings } from "@/utils/mixins/mixins";
import IconsPickerModal from "../ui/components/modal-icon-picker";
import MyPlugin from "@/main";
import { addInlineFields } from "@/utils/html-fields";
import { Logger } from "@/utils/logging";
x;
export default class TransformationSettings extends BaseSettings {
	private app: App;
	private textPattern!: TextComponent;
	private chooseIconBtn!: ButtonComponent;
	private refreshDisplay: () => void;
	protected log: Logger = new Logger().setContext(this);
	constructor(
		plugin: MyPlugin,
		containerEl: HTMLElement,
		app: App,
		refreshDisplay: () => void
	) {
		super(plugin, containerEl);
		this.app = app;
		this.refreshDisplay = refreshDisplay;
	}

	/**
	 * Updates all the open files based on the custom rule that was specified.
	 * @param rule Rule that will be used to update all the icons for all opened files.
	 * @param remove Whether to remove the icons that are applicable to the rule or not.
	 */

	public display(): void {}

	private displayGeneral() {
		new Setting(this.containerEl).setName("Paste").setHeading();

		new Setting(this.containerEl)
			.setName("Fallback Regular expression")
			.setDesc(
				"Regular expression used to match URLs when default match fails."
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter regular expression here..")
					.setValue(this.plugin.settings.regex)
					.onChange(async (value) => {
						if (value.length > 0) {
							await this.plugin.updateSettings({
								regex: value,
							});
						}
					})
			);

		new Setting(this.containerEl)
			.setName("Behavior when nothing is selected")
			.setDesc(
				"Auto Select: Automatically select word surrounding the cursor."
			)
			.addDropdown((dropdown) => {
				const options: Record<NothingSelected, string> = {
					0: "Do nothing",
					1: "Auto Select",
					2: "Insert [](url)",
					3: "Insert <url>",
				};
				dropdown
					.addOptions(options)
					.setValue(this.plugin.settings.nothingSelected.toString())
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							nothingSelected: +value,
						});
						this.display();
					});
			});
	}

	displayTransformations() {
		const setting = new Setting(this.containerEl)
			.setName("Fields")
			.setHeading()
			.setDesc(
				"Will replace the pattern with the replacement and apply the icon."
			);
		setting.addText((text) => {
			text.onChange((value) => {
				this.chooseIconBtn.setDisabled(value.length === 0);
			});
			text.setPlaceholder("Rule name");
			this.textPattern = text;
		});
		setting.addButton((btn) => {
			btn.setDisabled(true);
			btn.setButtonText("Choose icon");
			btn.onClick(async () => {
				if (this.textPattern.getValue().length === 0) {
					return;
				}
				const modal = new IconsPickerModal(this.app, this.plugin, "");
				modal.onChooseItem = async (item) => {
					const rule: TransformationRule = {
						...DEFAULT_TRANSFORMATION_RULE,
						name: this.textPattern.getValue(),
						icon:
							typeof item === "object" ? item.displayName : item,
					};
					this.plugin.updateSettings({
						transformations: [
							...this.plugin.settings.transformations,
							rule,
						],
					});
					new Notice("Rule added.");
					this.textPattern.setValue("");
					this.refreshDisplay();
				};
				modal.open();
			});
			this.chooseIconBtn = btn;
		});

		this.plugin.settings.transformations.forEach((rule, index) => {
			const ruleSection = new Setting(this.containerEl).setName(
				`${rule.icon} ${rule.name}`
			);
			const currentOrder = index;

			/**
			 * Re-orders the custom rule based on the value that is passed in.
			 * @param valueForReorder Number that will be used to determine whether to swap the
			 * custom rule with the next rule or the previous rule.
			 */
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const orderTransformationRules = async (
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				valueForReorder: number
			): Promise<void> => {
				this.refreshDisplay();
			};

			ruleSection.addExtraButton((btn) => {
				const isFirstOrder = currentOrder === 0;
				btn.setDisabled(isFirstOrder);
				btn.setIcon("arrow-up");
				btn.setTooltip("Prioritize the custom rule");
				btn.onClick(async () => {
					// await orderTransformationRules(-1);
				});
			});
			ruleSection.addExtraButton((btn) => {
				const isLastOrder =
					currentOrder ===
					this.plugin.settings.transformations.length - 1;
				btn.setDisabled(isLastOrder);
				btn.setIcon("arrow-down");
				btn.setTooltip("Deprioritize the custom rule");
				btn.onClick(async () => {
					// await orderTransformationRules(1);
				});
			});

			// Add the edit custom rule button.
			ruleSection.addButton((btn) => {
				btn.setIcon("pencil");
				btn.setTooltip("Edit the custom rule");
				btn.onClick(() => {
					const updatedRule = { ...rule };
					let testInputText = "";
					// Create modal and its children elements.
					const modal = new Modal(this.plugin.app);
					modal.contentEl.style.display = "block";
					modal.titleEl.setText("Edit custom rule");

					const nameSetting = new Setting(modal.contentEl);
					nameSetting.setName("Name");
					nameSetting.addText((input) => {
						input.setValue(updatedRule.name).onChange((value) => {
							updatedRule.name = value;
							updatePreview();
						});
					});

					const toggleSetting = new Setting(modal.contentEl);
					toggleSetting.setName("Enabled");
					toggleSetting.addToggle((toggle) =>
						toggle
							.setValue(updatedRule.enabled === true)
							.onChange((value) => {
								updatedRule.enabled = value;
							})
					);

					new Setting(modal.contentEl)
						.setName("Value Regex")
						.setDesc(
							"Add a regex expression to match the value to the field"
						)
						.addText((input) => {
							input
								.setValue(updatedRule.pattern)
								.setPlaceholder("regex");

							const updateSelf = () => {
								const testPattern = (
									value: string
								): boolean | null => {
									if (!value) return null;
									try {
										new RegExp(value);
									} catch (e) {
										input.inputEl.toggleClass(
											"classy-input-failure",
											false
										);
										return false;
									}
									return true;
								};

								const result = testPattern(updatedRule.pattern);
								input.inputEl.toggleClass(
									"classy-input-failure",
									result === false
								);
								input.inputEl.toggleClass(
									"classy-input-success",
									result === true
								);
								input.inputEl.toggleClass(
									"classy-input-warning",
									result === null
								);
							};
							input.onChange(async (value) => {
								updatedRule.pattern = value;
								updateSelf();
								updatePreview();
							});
							updateSelf();
						})
						.addText((input) => {
							input
								.setValue(updatedRule.replacement)
								.setPlaceholder("replacement");
							input.onChange(async (value) => {
								updatedRule.replacement = value;
								updatePreview();
							});
						});

					new Setting(modal.contentEl)
						.setName("Output Type")
						.setDesc("Determines how to format matching values")
						.addButton((btn) => {
							const updateSelf = (
								isFor: typeof updatedRule.for
							) => {
								if (isFor === "field") {
									btn.setIcon("info");
								} else if (isFor === "link") {
									btn.setIcon("link");
								} else {
									btn.setIcon("info");
								}
								btn.setTooltip(`${isFor}`);
							};
							btn.onClick(async () => {
								const isFor: typeof updatedRule.for =
									updatedRule.for ?? "field";
								if (isFor === "field") {
									updatedRule.for = "link";
								} else if (isFor === "link") {
									updatedRule.for = "field";
								} else {
									updatedRule.for = "field";
								}
								updateSelf(updatedRule.for);
								updatePreview();
							});
							updateSelf(updatedRule.for);
						});

					new Setting(modal.contentEl)
						.setName("Key Format")
						.setDesc("How the key should be displayed")
						.addButton((btn) => {
							const updateSelf = () => {
								btn.setButtonText(
									updatedRule.use.charAt(0).toUpperCase() +
										updatedRule.use.slice(1)
								);
							};
							btn.onClick(async () => {
								const toUse: typeof updatedRule.use =
									updatedRule.use ?? "name";
								if (toUse === "icon") {
									updatedRule.use = "name";
								} else {
									updatedRule.use = "icon";
								}
								updateSelf();
								updatePreview();
							});
							updateSelf();
						});

					// Create the change icon button with icon preview.
					new Setting(modal.contentEl)
						.setName("Icon")
						.setDesc("Change the icon for the rule.")
						.addButton((btn) => {
							btn.setButtonText(updatedRule.icon);
							btn.onClick(async () => {
								const modal = new IconsPickerModal(
									this.app,
									this.plugin,
									updatedRule.icon
								);
								modal.onChooseItem = async (item) => {
									const icon =
										typeof item === "object"
											? item.displayName
											: item;
									btn.setButtonText(icon);
									updatedRule.icon = icon;
									updatePreview();
								};
								modal.open();
							});
						});

					// Color setting.
					const colorSetting = new Setting(modal.contentEl)
						.setName("Color")
						.setDesc("Change the icon color");
					const colorPicker = new ColorComponent(
						colorSetting.controlEl
					)
						.setValue(updatedRule.color ?? "#000000")
						.onChange((value) => {
							updatedRule.color = value;
							updatePreview();
						});
					colorSetting.addExtraButton((btn) => {
						btn.setIcon("reset");
						btn.setTooltip("Set color to the default one");
						btn.onClick(() => {
							colorPicker.setValue("#000000");
							updatedRule.color = "#000000";
							updatePreview();
						});
					});

					new Setting(modal.contentEl)
						.setName("Preview")
						.setHeading();

					const previewSection = modal.contentEl.createDiv();
					previewSection.style.display = "flex";
					const previewInput = previewSection.createDiv();
					previewInput.style.display = "flex";
					previewInput.style.width = "50%";
					const previewOutput = previewSection.createDiv();
					previewOutput.style.display = "flex";
					previewOutput.style.flexDirection = "column";
					previewOutput.style.width = "50%";
					previewOutput.style.padding = "10px";
					previewOutput.style.alignItems = "left";
					previewOutput.style.overflow = "auto";

					const testInput = new TextAreaComponent(previewInput)
						.setValue(testInputText)
						.setPlaceholder("Example input")
						.onChange((value) => {
							testInputText = value;
							updatePreview();
						});
					testInput.inputEl.style.width = "100%";
					testInput.inputEl.style.height = "100px";
					testInput.inputEl.style.resize = "none";

					const rawPreview = previewOutput.createDiv();
					rawPreview.style.display = "flex";

					const markdownPreview = previewOutput.createDiv();
					markdownPreview.style.display = "flex";

					const updatePreview = async () => {
						const getKeyFormat = () => {
							switch (updatedRule.use) {
								case "icon":
									return updatedRule.icon;
								case "name":
									return updatedRule.name;
								case "both":
									return `${updatedRule.icon} ${updatedRule.name}`;
							}
						};
						const getValue = () => {
							const patternRegex = new RegExp(
								updatedRule.pattern
							);
							if (!testInputText) {
								return "";
							}
							if (patternRegex.test(testInputText)) {
								return testInputText.replace(
									patternRegex,
									updatedRule.replacement
								);
							}
							return testInputText;
						};

						const getPreviewText = (key: string, value: string) => {
							this.log.debug({}, "value", value);
							switch (updatedRule.for) {
								case "field":
									return `[${key}:: ${value}]`;
								case "link":
								default:
									return `[${key}](${value})`;
							}
						};
						const key = getKeyFormat();
						// Raw preview.
						rawPreview.setText(getPreviewText(key, testInputText));
						// Markdow preview.
						const currentFile = this.app.workspace.getActiveFile();
						const currentFilePath = currentFile?.path;
						markdownPreview.empty();
						await MarkdownRenderer.render(
							this.plugin.app,
							getPreviewText(key, getValue()),
							markdownPreview,
							currentFilePath || "",
							this.plugin
						);
						addInlineFields(markdownPreview);
					};
					updatePreview();

					// Create the save button.
					const saveEl = modal.contentEl.createDiv();
					saveEl.style.display = "flex";
					saveEl.style.justifyContent = "flex-end";
					const saveButton = new ButtonComponent(saveEl);
					saveButton.setButtonText("Save").setCta();
					saveButton.onClick(async () => {
						await this.plugin.updateSettings({
							transformations:
								this.plugin.settings.transformations.map((r) =>
									Object.is(r, rule) ? updatedRule : r
								),
						});
						this.refreshDisplay();
						new Notice("Custom rule updated.");
						modal.close();
					});

					modal.open();
				});
			});

			// Add the delete custom rule button.
			ruleSection.addButton((btn) => {
				btn.setIcon("trash");
				btn.setTooltip("Remove the custom rule");
				btn.onClick(async () => {
					await this.plugin.updateSettings({
						transformations:
							this.plugin.settings.transformations.filter(
								(r) => !Object.is(r, rule)
							),
					});
					this.refreshDisplay();
					new Notice("Custom rule deleted.");
				});
			});
		});
	}
}
