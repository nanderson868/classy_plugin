import type MyPlugin from "@/main";
import { type DataArray, type DataObject } from "obsidian-dataview";
import type { Task, TasksView } from "@/features/tasks/view-tasks";
import { taskPriorities } from "@/features/tasks/view-tasks";
import { Logger } from "./logging";
import { TaskFilterBuilder } from "@/features/tasks/filter";

// interface TaskView {
// 	plugin: ClassyPlugin;
// 	view: TasksView;
// 	filter: TaskFilterBuilder;
// 	target: HTMLElement;
// 	tasks: DataArray;
// 	update(): void;
//  search(value?: string): DataArray;
// 	refresh(): void;
// 	render(tasks: DataArray): void;
// }

// export abstract class TaskListLayout implements Layout {
// 	fields: Partial<Task> = {};
// 	lists: TaskList[] = [];
// 	update() {
// 		this.lists.forEach((list) => list.update());
// 	}
// }

type GroupedArray = {
	key: string;
	rows: DataArray;
};

interface List {
	onUpdate(): void;
	render(tasks: DataArray): void;
}

export abstract class TaskList implements List {
	public name!: string;
	private tasks: DataArray;
	protected log: Logger = new Logger().setContext(this);

	constructor(
		protected plugin: MyPlugin,
		protected view: TasksView,
		public filter: TaskFilterBuilder,
		public target: HTMLElement
	) {}

	/**
	 * Update state and refresh the task list.
	 */
	update() {
		this.onUpdate();
		this.tasks = this.view.tasks.filter(this.filter.get());
		this.refresh();
	}

	/**
	 * Called when the task list needs to be updated.
	 */
	onUpdate() {}

	refresh() {
		this.target.empty();
		if (!this.view.searchValue) this.render(this.tasks);
		else this.render(this.search(this.view.searchValue));
	}

	protected search(value: string): DataArray {
		return this.tasks.filter((task: Task) => task.text.includes(value));
	}

	abstract render(tasks: DataArray): void;
}

export class GlobalTaskList extends TaskList {
	render(tasks: DataArray) {
		tasks
			.groupBy((task: DataObject) => task.priority)
			.sort((a: GroupedArray, b: GroupedArray) => {
				const pA = taskPriorities.indexOf(a.key);
				const pB = taskPriorities.indexOf(b.key);
				return pA - pB;
			}, "desc")
			.limit(this.plugin.settings.taskLimit)
			.forEach(async (group: GroupedArray) => {
				const g1Header = group.key ? group.key.toUpperCase() : "-";
				this.target.createEl("hr");
				this.target.createEl("h1", { text: g1Header });
				await this.view.renderTaskList(group.rows, false);
			});
	}
}

export class LocalTaskList extends TaskList {
	render() {
		const localTasks = this.view.currentPage?.file?.tasks.array();
		if (!localTasks) return;
		this.view.renderTaskList(localTasks, false);
	}
}

export class RelatedTaskList extends TaskList {
	onUpdate(): void {
		const isDailyNote =
			this.view.currentPage?.file?.folder ==
			this.plugin.settings.dailyNotesFolder;
		const currentDay = isDailyNote
			? this.view.currentPage?.file?.day
			: null;
		const currentTags = this.view.currentPage?.tags || [];
		if (currentDay) {
			this.filter.scheduledOn(currentDay);
			this.filter.remove(this.filter.isTagOverlap);
		} else {
			this.filter.tagOverlap(currentTags);
			this.filter.remove(this.filter.isScheduledOn);
		}
	}

	render(tasks: DataArray) {
		this.view.renderTaskList(tasks, true);
	}
}
