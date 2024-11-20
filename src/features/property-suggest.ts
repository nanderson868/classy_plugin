import { TagSuggest, LinkSuggest, FieldSuggest } from "@/utils/suggest";
import MyPlugin from "@/main";
import { FieldSetting } from "../types";
import { Logger } from "@/utils/logging";

const defaultFields: FieldSetting[] = [
	{ name: "tags", enabled: true },
	{ name: "link", enabled: true },
];

const customFields: FieldSetting[] = [
	{
		name: "notes",
		enabled: true,
		options: {
			lookup: {
				field: "class",
				value: "note",
			},
		},
	},
];
export class PropertySuggest {
	private settings: FieldSetting[] = [...defaultFields, ...customFields]; // this.plugin.settings.fields

	/**
	 * Initializes the PropertySuggest class with a reference to the main plugin instance.
	 * @param plugin The main ClassyPlugin instance.
	 */
	protected log = new Logger().setContext(this);
	constructor(private plugin: MyPlugin) {
		this.settings
			.filter((setting) => setting.enabled)
			.forEach((setting) => {
				this.activateField(setting);
			});
	}

	/**
	 * Activates the suggestion functionality for a specific field.
	 * @param setting Configuration settings for the field including the field name, whether it's enabled, and any specific options.
	 */
	private activateField = (setting: FieldSetting) => {
		const fieldInput = this.getFieldEl(setting.name);
		if (!fieldInput) return;
		this.decorateFieldEl(fieldInput);
		switch (setting.name) {
			case "tags":
				return new TagSuggest(
					fieldInput as HTMLInputElement,
					this.plugin.app,
					this.plugin
				);
			case "link":
				return new LinkSuggest(
					fieldInput as HTMLInputElement,
					this.plugin.app,
					this.plugin
				);
			default:
				if (!setting.options?.lookup) return;
				return new FieldSuggest(
					fieldInput as HTMLInputElement,
					this.plugin.app,
					this.plugin,
					() => {},
					setting.options
				);
		}
	};

	/**
	 * Retrieves the HTML element associated with a specific field.
	 * @param field The name of the field.
	 * @returns The HTMLElement corresponding to the field, if found.
	 */
	private getFieldEl = (field: string) => {
		return this.plugin.app.workspace.containerEl.find(
			`.metadata-property[data-property-key=${field}] .multi-select-input[contenteditable=true]`
		);
	};

	private decorateFieldEl = (el: HTMLElement) => {
		el.style.border = "1px dashed lime";
	};
}
