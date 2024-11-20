import { getCurrentLocationFromIP } from "@/utils/locale";
import { FileFormulas } from "./abstract-fields";
// import { lowercaseKeys } from "./utils";

export class File extends FileFormulas {
	get title() {
		return this.page.title || "";
	}

	get display() {
		return `${this.tags}${this.title}`;
	}

	get tags() {
		if (!this.page.tags || this.page.tags.length === 0) return "";
		const groupedTags = this.page.tags.reduce((accumulator, tag) => {
			const parts = tag.split("/");
			const root = parts.shift() || this.config.categoryFallback;
			const subTag =
				parts.join(this.config.subTagDelimiter) ||
				this.config.subCategoryFallback;
			if (accumulator[root]) accumulator[root].push(subTag);
			else accumulator[root] = [subTag];
			return accumulator;
		}, {} as Record<string, string[]>);

		const formattedTags = Object.entries(groupedTags)
			.map(
				([key, values]) =>
					`${key}${this.config.rootDelimiter}${values.join(
						this.config.subTagDelimiter
					)}`
			)
			.join(this.config.groupDelimiter);

		return formattedTags;
	}
}

export class DailyNote extends FileFormulas {
	get location() {
		return getCurrentLocationFromIP();
	}

	get new() {
		const dv = this.plugin.proxy.api.dv;
		return dv
			.pages(this.sources)
			.filter(
				(p) =>
					dv.equal(p.file.cday, this.page.file.day) &&
					p.file.path != this.page.file.path
			)
			.map((p) => `[[${p.file?.name}]]`)
			.array();
	}
}

export class Identity extends FileFormulas {
	get display() {
		return `${this.page.title}`;
	}
}

export class Email extends FileFormulas {
	sender = this.page.sender ? `(${this.page.sender})` : "";

	get display() {
		return `${this.page.subject} ${this.sender}`;
	}
}

// export type ClassName = keyof typeof classConfig;
// export type FieldClass = (typeof classConfig)[keyof typeof classConfig];
