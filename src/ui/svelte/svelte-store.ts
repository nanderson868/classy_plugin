/* eslint-disable @typescript-eslint/no-unused-vars */
import { writable } from "svelte/store";
import type MyPlugin from "@/main";
import type { TasksView } from "@/features/tasks/view-tasks";

export default {
	plugin: writable<MyPlugin>(),
	view: writable<TasksView>(),
	// states: writable<States>({} as States),
	source: writable<string>(""),
	tags: writable<string[]>([]),
};
