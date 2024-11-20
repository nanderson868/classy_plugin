/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	setIcon,
	Menu,
	type MarkdownPostProcessorContext,
	Setting,
	Plugin,
} from "obsidian";
import { SmartEditorSuggest } from "@/features/editor-suggest";
import { type Extension } from "@codemirror/state";
import ClassySettingsTab, {
	DefaultSettings,
	type MySettings,
} from "@/settings";
import { WorkspaceLeaf } from "obsidian";
import {
	inlineFieldsField,
	replaceInlineFieldsInLivePreview,
} from "./ui/dataview/inline-field-live-preview";
import {
	TasksView,
	VIEW_TYPE_TASKS_LOCAL,
	VIEW_TYPE_TASKS_GLOBAL,
	VIEW_TYPES,
} from "./features/tasks/view-tasks";
import { HandleEditorPaste } from "@/features/editor-paste";
import { inlinePlugin } from "@/ui/dataview/lp-render";
import { addInlineFields } from "@/utils/html-fields";
import { MetadataManager } from "@/features/metadata/metadata-manager";
import { APIProxy } from "@/api";
import { SamplePlugin } from "@ref/plugin";
import { PropertySuggest } from "@/features/property-suggest";
import { Logger } from "@/utils/logging";
import { ProxyRuntimeTest } from "./api/test";
import { Features } from "./utils/mixins/mixins";

const SAMPLE = false;

export const enum NothingSelected {
	doNothing,
	autoSelect,
	insertInline,
	insertBare,


	type RequiredProperty<T extends object> = { [P in keyof T]-?: Required<NonNullable<T[P]>>; };
}

export const DEFAULT_SETTINGS: DefaultSettings = {
	debugMode: false,
	dateFormat: "YYYY-MM-DD",
	mySetting: "default",
	taskTag: "task",
	notesFolders: ["Notes"],
	dailyNotesFolder: "Daily Notes",
	eventTag: "event",
	discreteTag: "-/",
	enabled: true,
	enableOnStartup: false,
	showLocalTasks: true,
	taskLimit: 100,
	// eslint-disable-next-line no-useless-escape
	regex: /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
		.source,
	projectTags: "",
	editorMenuEnabled: false,
	prettyRenderInlineFieldsInLivePreview: false,
	prettyRenderInlineFields: false,
	safeMode: false,
	autoFormulas: true,
	tasksUpdateInterval: 1000,
};

export default class MyPlugin extends Plugin {
	features = new FeatureEnabled(this);
	settings!: MySettings;

	proxy = new APIProxy(app)
		.addPath("dv", "dataview.api")
		.addPath("meta", "metadata-menu.api");
	private discreteToggleButton!: HTMLElement;
	private editorExtensions: Extension[] = [];
	private log = new Logger().setContext(this);

	async onload() {
		this.log.info(`+------ Plugin loading ------+`);
		// Optionally load as a sample plugin
		if (SAMPLE) SamplePlugin.prototype.onload.bind(this);

		// Initialize Settings
		this.settings = Object.assign(
			DEFAULT_SETTINGS,
			{ features: this.features.settings },
			(await this.loadData()) ?? {}
		);
		if (this.settings.enableOnStartup) {
			document.body.classList.toggle("classy-discrete");
		}

		// Listen for cache updates
		this.registerEvent(
			this.app.metadataCache.on(
				// @ts-expect-error This is a private event (I think)
				"dataview:index-ready",
				() => {
					this.log.info("dataview:index-ready");
					this.setupViews();
					this.setupUI();
					this.setupSuggestors();
					this.setupExtensions();
					this.setupEvents();
				}
			)
		);

		this.features;

		// Run tests after a short delay
		if (this.settings.debugMode) {
			this.log.info("Debug mode enabled, running tests...");
			setTimeout(async () => {
				new ProxyRuntimeTest(this.app);
			}, 1000);
		}

		this.log.info(`+------ Plugin loaded ------x-+`);
	}

	onunload() {
		this.log.info(`+------ Plugin unloading ------x-+`);
	}

	async updateSettings(settings: Partial<MySettings>) {
		Object.assign(this.settings, settings);
		await this.saveData(this.settings);
	}

	private setupViews() {
		VIEW_TYPES.forEach((viewType) => {
			this.registerView(viewType, (leaf) => {
				return new TasksView(leaf, this, viewType);
			});
			this.addCommand({
				id: `open-task-view-${viewType}`,
				name: `Open ${viewType} task view`,
				callback: () => {
					this.activateView(viewType);
				},
			});
		});
	}

	private setupEvents() {
		new MetadataManager(this);

		this.registerEvent(
			this.app.workspace.on("editor-paste", (...args) =>
				HandleEditorPaste(this, ...args)
			)
		);
	}

	private setupSuggestors() {
		this.addCommand({
			id: "field-suggest",
			name: "Activate field suggestions",
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			callback: () => {
				this.log.debug("command: field-suggest...");
				new PropertySuggest(this);
			},
		});
		this.registerEditorSuggest(new SmartEditorSuggest(this.app, this));
	}

	private setupUI() {
		this.addSettingTab(new ClassySettingsTab(this.app, this));

		this.addRibbonIcon("menu", "Open menu", (event) => {
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle("Global Tasks")
					.setIcon("globe")
					.onClick(() => {
						this.activateView(VIEW_TYPE_TASKS_GLOBAL);
					})
			);
			menu.addItem((item) =>
				item
					.setTitle("Page Tasks")
					.setIcon("check-square")
					.onClick(() => {
						this.activateView(VIEW_TYPE_TASKS_LOCAL);
					})
			);
			menu.showAtMouseEvent(event);
		});

		// Ribbon Icon: toggle css class
		this.discreteToggleButton = this.addRibbonIcon(
			"shield-off",
			"Toggle Discrete Mode",
			(evt: MouseEvent) => {
				this.toggleDiscreteMode();
				this.log.debug("timestamp", evt.timeStamp);
			}
		);
	}

	private setupExtensions() {
		// Setup editor extensions
		this.editorExtensions = [];
		this.registerEditorExtension(this.editorExtensions);
		this.updateEditorExtensions();

		this.registerPriorityMarkdownPostProcessor(100, async (el) => {
			if (!this.settings.prettyRenderInlineFields) return;
			await addInlineFields(el);
		});

		// (From Dataview) Mainly intended to detect when the user switches between live preview and source mode.
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				// this.app.workspace.iterateAllLeaves((leaf) => {
				// 	if (
				// 		leaf.view instanceof MarkdownView &&
				// 		leaf.view.editor.cm
				// 	) {
				// 		leaf.view.editor.cm.dispatch({
				// 			effects: workspaceLayoutChangeEffect.of(null),
				// 		});
				// 	}
				// });
			})
		);
	}

	private toggleDiscreteMode() {
		document.body.classList.toggle("classy-discrete");
		this.handleDiscreteModeToggle();
	}

	private handleDiscreteModeToggle() {
		setIcon(
			this.discreteToggleButton,
			document.body.classList.contains("classy-discrete")
				? "shield-check"
				: "shield-off"
		);
	}

	/** Register a markdown post processor with the given priority. */
	private registerPriorityMarkdownPostProcessor(
		priority: number,
		processor: (
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => Promise<void>
	) {
		// eslint-disable-next-line prefer-const
		let registered = this.registerMarkdownPostProcessor(processor);
		registered.sortOrder = priority;
	}

	/**
	 * This funcion should be called to update editor extensions with the latest settings
	 */
	public updateEditorExtensions() {
		this.log.info("updating editor extensions...");
		this.editorExtensions.length = 0;
		// editor extension for inline queries: enabled regardless of settings (enableInlineDataview/enableInlineDataviewJS)
		this.editorExtensions.push(inlinePlugin(this.app, this.settings));
		// editor extension for rendering inline fields in live preview
		if (this.settings.prettyRenderInlineFieldsInLivePreview) {
			this.editorExtensions.push(
				inlineFieldsField,
				replaceInlineFieldsInLivePreview(this.app, this.settings)
			);
		}
		this.app.workspace.updateOptions();
	}

	private async activateView(viewType: string) {
		if (!this.proxy.api.dv) return;

		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(viewType);
		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf) await leaf.setViewState({ type: viewType, active: true });
		}
		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) workspace.revealLeaf(leaf);
	}

	public async resetView(viewType: string) {
		const { workspace } = this.app;
		workspace.detachLeavesOfType(viewType);
		this.activateView(viewType);
	}
}
