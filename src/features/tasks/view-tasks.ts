/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ItemView,
	WorkspaceLeaf,
	ButtonComponent,
	TFile,
	MarkdownRenderer,
	Menu,
	Notice,
	SearchComponent,
	DropdownComponent,
} from "obsidian";
import MyPlugin from "@/main";
import {
	DataviewApi,
	getAPI,
	isPluginEnabled,
	type DataObject,
	DataArray,
} from "obsidian-dataview";
import { DateTime } from "luxon";
import ComponentAdvanced from "@/ui/svelte/Component-advanced.svelte";

import {
	GlobalTaskList,
	LocalTaskList,
	RelatedTaskList,
	TaskList,
} from "@/utils/task-filters";
import { textFieldsToMarkdown } from "@/utils/html-formatting";
import TaskFilterModal from "@/features/tasks/modal-task-filter";
import { Page } from "@/api/dataview";
import { Logger } from "@/utils/logging";
import { TaskFilterBuilder } from "./filter";

export const VIEW_TYPE_TASKS_LOCAL = "task-view-local";
export const VIEW_TYPE_TASKS_RELATED = "task-view-related";
export const VIEW_TYPE_TASKS_GLOBAL = "task-view-global";

const DEBUG = false;

export const VIEW_TYPES: TasksViewType[] = [
	VIEW_TYPE_TASKS_LOCAL,
	VIEW_TYPE_TASKS_RELATED,
	VIEW_TYPE_TASKS_GLOBAL,
];
type TasksViewType =
	| typeof VIEW_TYPE_TASKS_LOCAL
	| typeof VIEW_TYPE_TASKS_RELATED
	| typeof VIEW_TYPE_TASKS_GLOBAL;

type Renderer = () => Promise<void>;

type CalloutProps = {
	type: string;
	title: string | null;
	foldType: "" | "+" | "-";
	count: number | null;
};

export const taskPriorities = [
	"lowest",
	"low",
	"normal",
	"medium",
	"high",
	"highest",
];

type Status =
	| "loaded"
	| "updating"
	| "active"
	| "checking"
	| "indexed"
	| "visible"
	| "rendered"
	| "request";

export type ViewState = Record<Status, boolean>;

export type TaskFilter = (task: Task, ...args: unknown[]) => boolean;

/**
 * @link https://blacksmithgu.github.io/obsidian-dataview/annotation/metadata-tasks/
 */
export interface Task extends DataObject {
	[key: string]: unknown;
	// [key: string]:
	// 	| boolean
	// 	| undefined
	// 	| string
	// 	| DateTime
	// 	| string[]
	// 	| null
	// 	| Task[];
	path: string;
	visual: string;
	text: string;
	tags: string[];
	children: Task[];
	completed: boolean;
	archived: boolean;
	cancelled: DateTime;
	scheduled: DateTime;
	priority: string;
}

export class TasksView extends ItemView {
	plugin: MyPlugin;
	type: TasksViewType;
	api: DataviewApi;
	component: ComponentAdvanced;
	headerContainer: HTMLDivElement;
	componentContainer: HTMLDivElement;
	filterContainer: HTMLDivElement;
	listContainer: HTMLDivElement;
	searchValue: string | null = null;
	isSearching = false;
	states: ViewState = {
		loaded: false,
		indexed: false,
		updating: false,
		checking: false,
		active: false,
		visible: false,
		rendered: false,
		request: false,
	};
	error: string | null = null;
	currentFile: TFile | null = null;
	currentPage: Page | null = null;
	pages: DataArray = [];
	tasks: DataArray = [];
	list: TaskList | null = null;
	protected log = new Logger().setContext(this);

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin, type: TasksViewType) {
		super(leaf);
		this.plugin = plugin;
		this.type = type;
		this.contentEl.addClass("classy-content");
		this.headerContainer = this.contentEl.createDiv({
			cls: "classy-header",
		});
		this.componentContainer = this.contentEl.createDiv({
			cls: "classy-component",
		});
		this.filterContainer = this.contentEl.createDiv({
			cls: "classy-filter",
		});
		this.listContainer = this.contentEl.createDiv({
			cls: "classy-list",
		});
		this.component = new ComponentAdvanced({
			target: this.componentContainer,
			props: {
				view: this,
				states: this.states,
				tags: [],
				day: null,
				source: "",
			},
		});
		this.navigation = false;
		this.setLayout();
	}

	setLayout() {
		switch (this.type) {
			case "task-view-global":
				this.list = new GlobalTaskList(
					this.plugin,
					this,
					new TaskFilterBuilder(this).completed(false),
					this.listContainer
				);
				break;
			case "task-view-local":
				this.list = new LocalTaskList(
					this.plugin,
					this,
					new TaskFilterBuilder(this).completed(false),
					this.listContainer
				);
				break;
			case "task-view-related":
				this.list = new RelatedTaskList(
					this.plugin,
					this,
					new TaskFilterBuilder(this).completed(false),
					this.listContainer
				);
				break;
			default:
				this.log.error("Invalid view type: " + this.type);
			// throw new Error("Invalid view type");
		}
	}

	getViewType() {
		return this.type;
	}

	getDisplayText() {
		switch (this.type) {
			case "task-view-global":
				return "Global Tasks";
			case "task-view-local":
				return "Local Tasks";
			case "task-view-related":
				return "Related Tasks";
		}
	}

	getIcon(): string {
		switch (this.type) {
			case "task-view-global":
				return "globe";
			case "task-view-local":
				return "check-square";
			case "task-view-related":
				return "link";
		}
	}

	async onOpen() {
		// this.listContainer = this.contentEl.createDiv({
		// 	cls: "classy-list",
		// });
		this.setStatus("visible");
		try {
			this.setup();

			// Dataview API
			if (!isPluginEnabled(this.app))
				throw new Error("Dataview plugin not enabled");
			this.api = getAPI(this.app);
			if (!this.api) throw new Error("Dataview API not available");

			// Event listener for internal links
			this.contentEl.addEventListener("click", (event) =>
				this.handleClick(event)
			);

			// Listen for leaf updates
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", () =>
					this.handleUpdate()
				)
			);

			this.registerInterval(
				window.setInterval(
					() => this.handleUpdate(),
					this.plugin.settings.tasksUpdateInterval
				)
			);

			// Listen for cache updates
			this.plugin.registerEvent(
				this.plugin.app.metadataCache.on(
					// @ts-expect-error This is a private event (I think)
					"dataview:index-ready",
					() => {
						this.setStatus("indexed");
						this.handleUpdate(true);
					}
				)
			);
		} catch (e: unknown) {
			this.handleError(e as Error);
		} finally {
			this.setStatus("loaded");
		}
	}

	private setup() {
		// Menu actions
		const menuContainer = this.headerContainer.createDiv({
			cls: "classy-menu",
		});
		menuContainer.style.display = "flex";
		const searchButton = this.addAction("search", "Search", () => {
			if (this.isSearching) searchContainer.style.display = "none";
			else searchContainer.style.display = "block";
			this.isSearching = !this.isSearching;
		});
		const actionButton = this.addAction("refresh-cw", "Refresh", () =>
			this.handleUpdate(true)
		);
		const newButton = this.addAction("power", "Reset", () =>
			this.plugin.resetView(this.type)
		);
		const statusEl = this.addAction("filter", "Filter", () =>
			this.openFilter()
		);
		const infoEl = this.addAction("info", "Info", () => this.showStatus());
		menuContainer.appendChild(searchButton);
		menuContainer.appendChild(infoEl);
		menuContainer.appendChild(statusEl);
		menuContainer.appendChild(newButton);
		menuContainer.appendChild(actionButton);

		// Search bar
		const searchContainer = this.headerContainer.createDiv({
			cls: "classy-search",
		});
		searchContainer.style.display = "none";
		const search = new SearchComponent(searchContainer);
		search.onChange((value) => {
			this.handleSearch(value);
		});
	}

	private debug(message: string) {
		if (DEBUG) this.log.debug({}, this.getViewType() + " | " + message);
	}

	private showStatus() {
		const status = Object.entries(this.states).map(([key, value]) => {
			return `${key}: ${value}`;
		});
		new Notice(status.join("\n"));
	}

	private openFilter() {
		new TaskFilterModal(
			this.app,
			(result) => {
				new Notice(`Hello, ${result}!`);
			},
			(result) => {
				this.list?.filter.update({ completed: result });
				this.list?.update();
			},
			this.list?.filter.fields || {}
		).open();
	}

	private setStatus(status: Status, newStatus = true) {
		if (this.states[status] === newStatus) return;
		switch (status) {
			case "loaded":
			case "indexed":
			case "rendered":
				this.debug("- " + status);
				break;
			case "request":
			case "updating":
				this.debug(newStatus ? status + "..." : "complete: " + status);
				break;
			default:
				this.debug(newStatus ? " (=) " + status : " (!)" + status);
				break;
		}
		this.states[status] = newStatus;
		this.component.$set({ states: this.states });
	}

	private handleError(e: Error) {
		this.error = e.message;
		this.log.error(e);
	}

	private handleSearch(value: string) {
		this.searchValue = value;
		this.list?.update();
	}

	async handleUpdate(manual = false) {
		this.setStatus("request");
		try {
			// Save current states
			const previousFile = this.currentFile;
			this.currentFile = this.app.workspace.getActiveFile();
			const activeViewType = this.app.workspace
				.getActiveViewOfType(ItemView)
				?.getViewType();

			// Update current states
			if (activeViewType == this.type) {
				this.setStatus("active");
				this.setStatus("visible");
			} else if (activeViewType != "markdown")
				this.setStatus("visible", false);
			else this.setStatus("active", false);

			// Update according to states
			if (manual) await this.update();
			else if (!this.states.visible && !this.states.rendered)
				return this.debug("NOT VISIBLE");
			else if (!this.states.rendered) await this.update();
			else
				switch (this.type) {
					case "task-view-global":
						break;
					case "task-view-local":
					case "task-view-related":
						if (previousFile?.path != this.currentFile?.path)
							await this.update();
					// eslint-disable-next-line no-fallthrough
					default:
						this.debug("NO UPDATE NEEDED");
				}
		} catch (e: unknown) {
			this.handleError(e as Error);
		} finally {
			this.setStatus("request", false);
		}
	}

	async update() {
		this.setStatus("updating");
		try {
			await this.updateData();
			if (!this.states.loaded) this.setStatus("loaded");
			this.processData();
			this.list?.update();
			if (!this.states.rendered) this.setStatus("rendered");
			this.updateCSS();
		} catch (e: unknown) {
			this.handleError(e as Error);
		} finally {
			this.setStatus("updating", false);
		}
	}

	private async updateData(): Promise<void> {
		const folders = [
			...this.plugin.settings.notesFolders,
			this.plugin.settings.dailyNotesFolder,
		]
			.map((folder) => `"${folder}"`)
			.join(" or ");
		this.pages = await this.api.pages(
			`(${folders}) and #${this.plugin.settings.taskTag}`
		);
		this.tasks = this.pages.file.tasks;
		this.list?.update();
		if (this.currentFile)
			this.currentPage = await this.api.page(this.currentFile.path);
	}

	private processData() {
		this.component.$set({
			source: this.currentFile?.path,
			tags: this.currentPage?.tags || [],
			day: this.currentPage?.file.day || null,
		});
	}

	private decorateTask(task: Task) {
		task.children = task.children.map((child) => {
			child.visual = this.decorateTask(child);
			return child;
		});
		return textFieldsToMarkdown(task.text);
	}

	async renderTaskList(
		tasks: Task[],
		groupByFile = false,
		container: HTMLDivElement = this.listContainer
	) {
		tasks.forEach((task: Task) => (task.visual = this.decorateTask(task)));
		await this.api.taskList(
			tasks,
			groupByFile,
			container,
			this.plugin,
			this.currentFile?.path || tasks[0].path
		);
		const taskListEl = container.lastChild;
		if (!taskListEl || !(taskListEl instanceof HTMLDivElement))
			throw new Error("No task list element");
		return taskListEl;
	}

	private renderCallout = async (
		customProps: Partial<CalloutProps> = {},
		sourcePath: string = this.currentFile?.path || "",
		container: HTMLDivElement = this.listContainer
	): Promise<HTMLDivElement> => {
		const props: CalloutProps = {
			type: "header",
			title: "",
			foldType: "+",
			count: null,
			...customProps,
		};

		const markdown = `> [!${props.type}]${props.foldType} ${props.title} ${
			props.count ? "(" + props.count + ")" : ""
		}`;

		await MarkdownRenderer.render(
			this.plugin.app,
			markdown,
			container,
			sourcePath,
			this.plugin
		);
		const el: ChildNode | null = container.lastChild;
		if (!el || !(el instanceof HTMLDivElement))
			throw new Error("Not a div");
		if (!el.matches(`.callout`)) throw new Error("No callout");
		return el;
	};

	updateCSS() {
		const listItems = this.contentEl.querySelectorAll("ul .task-list-item");
		listItems.forEach((item) => {
			item.removeClass("dataview");
			item.addClass("classy-task");
		});
	}

	handleClick(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const link = target.closest("a.internal-link");
		if (!link) return;
		event.preventDefault();
		const linktext = link.getAttribute("href");
		if (!linktext) return;
		this.debug("Opening link: " + linktext);
		this.app.workspace.openLinkText(linktext, linktext, undefined, {
			active: false,
		});
	}

	async onClose() {
		this.debug("Closing view");
		this.component.$destroy();
	}
}
