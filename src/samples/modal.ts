import { Modal } from "obsidian";

export class SampleModal extends Modal {
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Sample Modal" });
		const book = contentEl.createEl("div", { cls: "book" });
		book.createEl("div", {
			text: "How to Take Smart Notes",
			cls: "book__title",
		});
		book.createEl("small", { text: "Sönke Ahrens", cls: "book__author" });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
