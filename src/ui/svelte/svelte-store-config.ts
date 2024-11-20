/* eslint-disable @typescript-eslint/no-unused-vars */
import { ItemView, WorkspaceLeaf } from "obsidian";
import type MyPlugin from "@/main";
import store from "./svelte-store";
import Component from "@/ui/svelte/Component.svelte";

const VIEW_TYPE_EXAMPLE = "example-view";

class ExampleView extends ItemView {
	component: Component = new Component({
		target: document.createElement("div"),
	});

	getDisplayText(): string {
		throw new Error("Method not implemented.");
	}
	plugin!: MyPlugin; // Add the 'plugin' property and initialize it

	getViewType(): string {
		throw new Error("Method not implemented.");
	}
	// ...

	async onOpen() {
		store.plugin.set(this.plugin);

		this.component = new Component({
			target: this.contentEl,
			props: {
				variable: 1,
			},
		});
	}
}
