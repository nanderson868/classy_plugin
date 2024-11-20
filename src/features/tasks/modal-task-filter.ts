import { Modal, App, Setting } from "obsidian";
import type { Task } from "@/features/tasks/view-tasks";
import { Logger } from "@/utils/logging";

export default class TaskFilter extends Modal {
	result!: string;
	protected log: Logger = new Logger().setContext(this);
	constructor(
		app: App,
		private onSubmit: (result: string) => void,
		private onChange: (complete: boolean) => void,
		private task: Partial<Task>
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.onChange = onChange;
	}

	onOpen() {
		this.log.info("onOpen");
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Task Filter" });

		// new Setting(contentEl).setName("Name").addText((text) =>
		// 	text.onChange((value) => {
		// 		this.result = value;
		// 	})
		// );

		Object.entries(this.task).forEach(([key, value]) => {
			this.log.debug({}, "entry: ", key, value);
			if (this.isKeyOfTask(key) && typeof this.task[key] === "boolean") {
				this.log.debug({}, "adding toggle: ", key, value);
				new Setting(this.contentEl).setName(key).addToggle((toggle) => {
					toggle
						.setValue(value as boolean)
						.onChange(async (newValue) => {
							if (typeof this.task[key] === "undefined") return;
							this.task[key] = newValue;
							this.onChange(newValue);
						});
				});
			}
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Accept")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				})
		);
	}

	// Type guard function to check if a key is a key of Task
	private isKeyOfTask(key: string | number): key is keyof Task {
		return key in this.task;
	}

	// addToggle(key: string, value: boolean) {
	// 	new Setting(this.contentEl).addToggle((toggle) => {
	// 		toggle.setValue(value as boolean).onChange((value) => {
	// 			this.task[key] = value;
	// 			this.onChange(value);
	// 		});
	// 	});
	// }

	// addToggle2(key: string, value: boolean) {
	// 	new Setting(this.contentEl)
	// 	.setName("Show tasks in the active file")
	// 	.addToggle((toggle) =>
	// 		toggle.setValue(true).onChange(async (value) => {
	// 			this.task.completed = value;
	// 		})
	// 	);
	// }

	onClose() {
		// eslint-disable-next-line prefer-const
		let { contentEl } = this;
		contentEl.empty();
	}
}
