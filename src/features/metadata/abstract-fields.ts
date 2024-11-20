/* eslint-disable @typescript-eslint/no-unused-vars */
import { Page } from "@/api/dataview";
import MyPlugin from "@/main";
import { Notice } from "obsidian";
import { Logger } from "@/utils/logging";
import { deepEquals, extractFormulas } from "./utils";
import { Metadata } from "./file-wrapper";

const DEFAULT_SETTINGS = {
	rootDelimiter: "-",
	subTagDelimiter: "-",
	groupDelimiter: " | ",
	categoryFallback: "Other",
	subCategoryFallback: "General",
	titleDelimiter: " : ",
};

type FieldSettings = typeof DEFAULT_SETTINGS;
type Field = string | string[];
type FieldCache<T> = Record<keyof T, Field>;

type CalculatedField = Field | Promise<Field>;

/** Abstract class for formula fields */
export abstract class FileFormulas {
	protected log: Logger = new Logger().setContext(this);
	protected config: FieldSettings = DEFAULT_SETTINGS;

	[key: string]: typeof key extends keyof FileFormulas
		? this[typeof key]
		: CalculatedField;

	constructor(protected plugin: MyPlugin, protected file: Metadata) {}

	public get page() {
		return new Proxy(this.file.page, {
			get: (target, prop) => {
				if (prop in this.cache) return this.cache[prop.toString()];
				return target[prop as keyof Page];
			},
		});
	}

	private get cache() {
		return this.file.frontmatter as FieldCache<this>;
	}

	private get fields() {
		return extractFormulas(this);
	}

	protected get sources() {
		return this.plugin.settings.notesFolders.map((f) => `"${f}"`).join(",");
	}

	public async update(fields = this.fields) {
		this.log.debug(`Formulas: ${fields}`);
		for (const field of fields) {
			const name = field.toString();
			try {
				const value = (await this[field]) as Field;
				if (!value) continue;
				const cached = this.cache[field];
				if (deepEquals(value, cached)) continue;
				await this.updateField(name, value);
				new Notice(`Updated: [${name}] | Prev: ${cached}`, 4000);
			} catch (e) {
				this.log.error(e);
			}
		}
	}

	private async updateField(name: string, value: Field) {
		this.log.info(`Posting payload [${name}]: ${value}`);
		await this.plugin.proxy.api.meta.postNamedFieldsValues(
			this.page.file.path,
			[{ name, payload: { value } }],
			undefined,
			Array.isArray(value)
		);
	}
}
