import { App, type FuzzyMatch, FuzzySuggestModal } from "obsidian";
import MyPlugin from "@/main";
import dom from "@/utils/dom";
import emoji from "@/ui/emoji";
import { doesIconExists } from "@/utils/icon-pack-manager";
import { Logger } from "@/utils/logging";

export interface Icon {
	name: string;
	iconPackName: string | null; // Can be `null` if the icon is an emoji.
	displayName: string;
	prefix: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class IconsPickerModal extends FuzzySuggestModal<any> {
	private plugin: MyPlugin;
	private path: string;

	private renderIndex = 0;

	private recentlyUsedItems: Set<string>;

	public onSelect!: (iconName: string) => void | undefined;

	protected log: Logger = new Logger().setContext(this);

	constructor(app: App, plugin: MyPlugin, path: string) {
		super(app);
		this.plugin = plugin;
		this.path = path;
		this.limit = 150;

		const pluginRecentltyUsedItems = plugin.settings.transformations.map(
			(transformation) => transformation.icon
		);

		this.recentlyUsedItems = new Set(
			pluginRecentltyUsedItems.reverse().filter((iconName) => {
				return doesIconExists(iconName) || emoji.isEmoji(iconName);
			})
		);

		this.resultContainerEl.classList.add("iconize-modal");
	}

	onOpen() {
		super.onOpen();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	getItemText(item: Icon): string {
		if (item.prefix === "Emoji") {
			return `${item.displayName} (${item.name})`;
		}
		return `${item.displayName} (${item.name})`;
	}

	getItems(): Icon[] {
		const iconKeys: Icon[] = [];
		Object.entries(emoji.shortNames).forEach(([unicode, shortName]) => {
			iconKeys.push({
				name: shortName,
				prefix: "Emoji",
				displayName: unicode,
				iconPackName: null,
			});
		});
		return iconKeys;
	}

	onChooseItem(item: Icon | string): void {
		const iconNameWithPrefix =
			typeof item === "object" ? item.displayName : item;
		dom.createIconNode(this.plugin, this.path, iconNameWithPrefix);
		this.log.debug({}, "onChooseItem", iconNameWithPrefix);
		this.onSelect?.(iconNameWithPrefix);
	}

	renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
		super.renderSuggestion(item, el);
		if (
			this.recentlyUsedItems.size !== 0 &&
			this.inputEl.value.length === 0
		) {
			if (this.renderIndex === 0) {
				const subheadline = this.resultContainerEl.createDiv();
				subheadline.classList.add("iconize-subheadline");
				subheadline.innerText = "Recently used Icons:";
				this.resultContainerEl.prepend(subheadline);
			} else if (this.renderIndex === this.recentlyUsedItems.size - 1) {
				const subheadline = this.resultContainerEl.createDiv();
				subheadline.classList.add("iconize-subheadline");
				subheadline.innerText = "All Icons:";
				this.resultContainerEl.append(subheadline);
			}
		}
		if (item.item.name !== "default") {
			if (item.item.prefix === "Emoji") {
				const displayName = "";
				el.innerHTML = `<div>${el.innerHTML}</div><div class="iconize-icon-preview">${displayName}</div>`;
			} else {
				// el.innerHTML = `<div>${
				// 	el.innerHTML
				// }</div><div class="iconize-icon-preview">${getSvgFromLoadedIcon(
				// 	item.item.prefix,
				// 	item.item.name
				// )}</div>`;
			}
		}

		this.renderIndex++;
	}
}
