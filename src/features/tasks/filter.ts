import type { Task, TaskFilter, TasksView } from "@/features/tasks/view-tasks";
import { DateTime } from "luxon";
import { Logger } from "@/utils/logging";

export class TaskFilterBuilder {
	private view: TasksView;
	private filters: TaskFilter[] = [];
	fields: Partial<Task> = {
		// completed: true,
		// scheduled: DateTime.now(),
	};

	tags: string[] = [];
	protected log: Logger = new Logger().setContext(this);

	isScheduledOn: TaskFilter = (task: Task) =>
		(task.scheduled &&
			this.fields.scheduled &&
			(DateTime.isDateTime(task.scheduled)
				? getDay(task.scheduled)
				: null) == getDay(this.fields.scheduled)) ||
		false;

	isTagOverlap = (task: Task) => {
		this.log.debug({}, "tagOverlap: ", this.tags);
		this.log.debug({}, "task tags: ", task.tags);
		return task.tags.some(
			(tag: string) => this.tags && this.tags.includes(tag.slice(1))
		);
	};
	private isCompleted: TaskFilter = (task: Task) =>
		task.completed == this.fields.completed;

	constructor(plugin: TasksView, useDefaults = true) {
		this.view = plugin;
		if (useDefaults) {
			this.tagged(this.view.plugin.settings.taskTag);
			this.tagged("archived", false);
			this.cancelled(false);
			const blacklistTags =
				this.view.plugin.settings.projectTags.split("\n");
			blacklistTags.forEach((tag: string) => this.tagged(tag, false));
		}
	}

	update(fields: Partial<Task>) {
		this.fields = { ...this.fields, ...fields };
	}

	private add(filter: TaskFilter) {
		if (!this.filters.includes(filter)) this.filters.push(filter);
	}

	remove(filter: TaskFilter) {
		this.filters = this.filters.filter((f) => f != filter);
	}

	get(): TaskFilter {
		if (this.filters.length == 0) return () => true;
		else if (this.filters.length == 1) return this.filters[0];
		return (task: Task) => this.filters.every((filter) => filter(task));
	}

	cancelled(cancelled = true) {
		this.add((task: Task) => (task.cancelled != undefined) == cancelled);
		return this;
	}

	tagged(tag: string, includes = true) {
		this.add((task: Task) => task.tags.includes("#" + tag) == includes);
		return this;
	}

	tagOverlap(tags: string[]) {
		this.tags = tags;
		this.add(this.isTagOverlap);
		return this;
	}

	archived(archived = true) {
		this.add((task: Task) => task.archived == archived);
		return this;
	}

	completed(completed = true) {
		this.fields.completed = completed;
		this.add(this.isCompleted);
		return this;
	}

	scheduledOn(date?: DateTime) {
		this.fields.scheduled = date;
		this.add(this.isScheduledOn);
		return this;
	}
}

export const getDay = (date: DateTime) => {
	return date.toFormat("yyyy-MM-dd");
};
