import { ALL_BOOKS, type Book } from "@/ui/components/modal-suggest";
import { FuzzySuggestModal, Notice } from "obsidian";

export class ExampleFuzzyModal extends FuzzySuggestModal<Book> {
	getItems(): Book[] {
		return ALL_BOOKS;
	}

	getItemText(book: Book): string {
		return book.title;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseItem(book: Book, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected ${book.title}`);
	}
}
