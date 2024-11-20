import { PluginSettingTab, App, Setting, ButtonComponent } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MyPlugin, { DEFAULT_SETTINGS, NothingSelected } from "@/main";

import TransformationSettings from "./transformations";
import { Logger } from "@/utils/logging";
import { QuerySettings } from "./dataview";

export interface DefaultSettings {
	debugMode: boolean;
	dateFormat: string;
	mySetting: string;
	taskTag: string;
	notesFolders: string[];
	dailyNotesFolder: string;
	eventTag: string;
	discreteTag: string;
	enabled: boolean;
	enableOnStartup: boolean;
	showLocalTasks: boolean;
	taskLimit: number;
	projectTags: string;
	regex: string;
	editorMenuEnabled: boolean;
	prettyRenderInlineFieldsInLivePreview: boolean;
	prettyRenderInlineFields: boolean;
	safeMode: boolean;
	autoFormulas: boolean;
	tasksUpdateInterval: number;
}

export interface MySettings extends DefaultSettings, QuerySettings {}

export default class ClassySettingsTab extends PluginSettingTab {
	plugin: MyPlugin;
	change: boolean;
	saveButton: ButtonComponent | null = null;
	protected log: Logger = new Logger().setContext(this);

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);

		this.plugin = plugin;
		this.change = false;
	}

	display(): void {
		this.log.debug("Displaying settings");
		// eslint-disable-next-line prefer-const
		let { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("General").setHeading();

		new Setting(containerEl)
			.setName("Notes Folder")
			.setDesc("Folder to use for notes")
			.addText((text) =>
				text
					.setPlaceholder(
						DEFAULT_SETTINGS.notesFolders?.join(",") ?? ""
					)
					.setValue(
						this.plugin.settings.notesFolders !=
							DEFAULT_SETTINGS.notesFolders
							? this.plugin.settings.notesFolders.join(",")
							: ""
					)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							notesFolders: value.split(","),
						});
					})
			);
		new Setting(containerEl)
			.setName("Daily Notes Folder")
			.setDesc("Folder to use for daily notes")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.dailyNotesFolder ?? "")
					.setValue(
						this.plugin.settings.dailyNotesFolder !=
							DEFAULT_SETTINGS.dailyNotesFolder
							? this.plugin.settings.dailyNotesFolder
							: ""
					)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							dailyNotesFolder: value,
						});
					})
			);
		new Setting(containerEl)
			.setName("Date format")
			.setDesc("Default date format")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.dateFormat ?? "")
					.setValue(
						this.plugin.settings.dateFormat !=
							DEFAULT_SETTINGS.dateFormat
							? this.plugin.settings.dateFormat
							: ""
					)
					.onChange(async (value) => {
						// this.plugin.getSettings().dateFormat = value;
						await this.plugin.updateSettings({ dateFormat: value });
					})
			);
		new Setting(containerEl).setName("UI").setHeading();
		new Setting(this.containerEl)
			.setName("Enable inline field highlighting in reading view")
			.setDesc(
				"Enables or disables visual highlighting / pretty rendering for inline fields in reading view."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.prettyRenderInlineFields)
					.onChange(
						async (value) =>
							await this.plugin.updateSettings({
								prettyRenderInlineFields: value,
							})
					)
			);

		new Setting(this.containerEl)
			.setName("Enable inline field highlighting in Live Preview")
			.setDesc(
				"Enables or disables visual highlighting / pretty rendering for inline fields in Live Preview."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings
							.prettyRenderInlineFieldsInLivePreview
					)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							prettyRenderInlineFieldsInLivePreview: value,
						});
						this.plugin.updateEditorExtensions();
					})
			);

		new Setting(containerEl).setName("Metadata").setHeading();
		new Setting(containerEl)
			.setName("Auto update formulas")
			.setDesc(
				"Automatically update field formulas when metadata is changed"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoFormulas)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							autoFormulas: value,
						});
					})
			);

		new Setting(containerEl).setName("Discrete Mode").setHeading();
		new Setting(containerEl)
			.setName("Discrete tag")
			.setDesc("Default discrete tag")
			.addText((text) =>
				text
					.setPlaceholder("discrete")
					.setValue(this.plugin.settings.discreteTag)
					.onChange(async (value) => {
						// this.plugin.getSettings().discreteTag = value;
						await this.plugin.updateSettings({
							discreteTag: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Safe mode")
			.setDesc(
				"Emphasize discrete content when discrete mode is disabled"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							safeMode: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Enabled on startup")
			.setDesc("Default state when Obsidian is launched")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableOnStartup)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							enableOnStartup: value,
						});
					})
			);

		new Setting(containerEl).setName("Tasks").setHeading();

		new Setting(containerEl)
			.setName("Task limit")
			.setDesc("Default task limit")
			.addText((text) =>
				text
					.setPlaceholder("100")
					.setValue(this.plugin.settings.taskLimit.toString())
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							taskLimit: parseInt(value),
						});
					})
			);

		new Setting(containerEl)
			.setName("Task tag")
			.setDesc("Default task tag")
			.addText((text) =>
				text
					.setPlaceholder("task")
					.setValue(this.plugin.settings.taskTag)
					.onChange(async (value) => {
						await this.plugin.updateSettings({ taskTag: value });
					})
			);

		new Setting(containerEl)
			.setName("Project Whitelist")
			.setDesc(
				createFragment((el) => {
					el.appendText(
						"Tags in this list will be considered as projects and won't appear in global tasks."
					);
					el.createEl("br");
					el.appendText(
						"Rules are regex-based, split by line break."
					);
				})
			)
			.addTextArea((text) => {
				text.setPlaceholder("Example:\nyoutu.?be|vimeo")
					.setValue(this.plugin.settings.projectTags)
					.onChange((value) => {
						this.plugin.updateSettings({
							projectTags: value,
						});
						return text;
					});
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});

		new Setting(containerEl)
			.setName("Show tasks in the active file")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLocalTasks)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							showLocalTasks: value,
						});
					})
			);

		// this.containerEl.createEl("h2", { text: "Transformation Settings" });

		new TransformationSettings(this.plugin, containerEl, app, () =>
			this.display()
		).display();

		new Setting(containerEl).setName("Development").setHeading();
		new Setting(containerEl)
			.setName("Enable debug mode")
			.setDesc("Enable debug mode")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							debugMode: value,
						});
					})
			);
	}

	private displayFeatures() {
		for (const feature of this.plugin.features) {
			feature.display();
		}
	}
}
