<script lang="ts">
	import type MyPlugin from "../../main";
	import { TasksView, type ViewState } from "@/features/tasks/view-tasks";
	import { MarkdownRenderer, Plugin } from "obsidian";
	import store from "./svelte-store";
	import { onMount } from "svelte";
	import type { DateTime } from "luxon";

	export let view: TasksView;
	export let states: ViewState;
	export let source: string;
	export let tags: string[];
	export let day: DateTime | null;

	const toMarkdown = async (text: string) => {
		await MarkdownRenderer.render(
			view.plugin.app,
			text,
			view.filterContainer,
			source,
			view.plugin,
		);
	};

	// $: if (states.active) {
	// 	const markdown = view.api.markdownList([1, 2, 3]);
	// 	toMarkdown(markdown);
	// }
	$: if (
		view.type == "task-view-related" &&
		(source || (tags && tags.length > 0))
	) {
		view.filterContainer.empty();
		if (day)
			toMarkdown(
				`[[${source.split(".")[0]}| ${day.toFormat("yyyy-MM-dd")}]]`,
			);
		if (tags) toMarkdown(tags.map((tag) => `#${tag}`).join(" "));
		// if (day) toMarkdown(day.toFormat("yyyy-MM-dd"));
	}
</script>

<div class="classy-view">
	<div
		class={`view-status-${view.error ? "error" : states.active ? "active" : ""}`}
	>
		<p class="view-info">{view.getDisplayText()}</p>
		<!-- {view.addAction("toggle", "Toggle", () => {})} -->
	</div>
</div>

<style>
	.view-info {
		font-size: 0.8em;
		font-weight: bold;
	}
	.view-status-active {
		color: rgb(222, 252, 178);
	}
	.view-status-error {
		color: red;
	}
</style>
