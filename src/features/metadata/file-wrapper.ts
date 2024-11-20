import { Page } from "@/api/dataview";
import { CachedMetadata, TFile } from "obsidian";
import MyPlugin from "@/main";
import { Logger } from "@/utils/logging";
import { DailyNote, Email, Identity, File } from "./field-formulas";

const SETTINGS = {
	classKey: "class",
	defaultClass: File,
	folders: {
		"Daily Notes": DailyNote,
	},
	classes: {
		Email,
		Identity,
	},
};

type ClassName = keyof typeof SETTINGS.classes;

type FieldClass =
	| (typeof SETTINGS.classes)[keyof typeof SETTINGS.classes]
	| (typeof SETTINGS.folders)[keyof typeof SETTINGS.folders];

type FieldFormulas = InstanceType<FieldClass>;

export class Metadata {
	protected log: Logger = new Logger().setContext(this, this.file.path);
	private _page?: Page;
	private _metadata?: CachedMetadata;
	private _formulas?: FieldFormulas;

	constructor(protected plugin: MyPlugin, public file: TFile) {}

	private get config() {
		return new Proxy(SETTINGS.classes, {
			get: (target, prop: string) => {
				const propKey = prop.toLowerCase();
				const targetKey = Object.keys(target).find(
					(k) => k.toLowerCase() === propKey
				);
				if (!targetKey) this.log.warn(`Unknown class: ${prop}`);
				return target[targetKey as keyof typeof target];
			},
		});
	}

	private get cache() {
		type Frontmatter<T> = Record<keyof T, T[keyof T]>;
		type Cache = Frontmatter<typeof this.frontmatter> & {
			[key in typeof SETTINGS.classKey]: ClassName;
		};
		const frontmatter = this.frontmatter || {};
		return new Proxy(frontmatter as Cache, {
			get: (target, prop: string) => {
				const propKey = prop.toLowerCase();
				return target[propKey as keyof typeof target];
			},
		});
	}

	public get page() {
		if (this._page) return this._page;
		this.log.info("GETTING | page...");
		const page = this.plugin.proxy.api.dv.page(this.file.path);
		if (!page) throw new Error(`Page not found: ${this.file.path}`);
		this._page = page;
		return this._page;
	}

	public get metadata() {
		if (this._metadata) return this._metadata;
		this.log.info("GETTING | metadata...");
		const metadata = this.plugin.app.metadataCache.getFileCache(this.file);
		if (!metadata) throw new Error(`Metadata not found: ${this.file.path}`);
		this._metadata = metadata;
		return metadata;
	}

	public set metadata(value) {
		if (this._metadata === value) return;
		this._metadata = value;
		this.log.info(`UPDATED | metadata: ${value}`);
	}

	public get frontmatter() {
		return this.metadata.frontmatter;
	}

	public get formulas() {
		let type: FieldClass = SETTINGS.defaultClass;
		const folder = this.page.file.folder as keyof typeof SETTINGS.folders;
		const name = this.cache[SETTINGS.classKey];
		if (folder in SETTINGS.folders) type = SETTINGS.folders[folder];
		else type = this.config[name];
		if (this._formulas?.constructor === type) return this._formulas;
		this._formulas = new type(this.plugin, this);
		return this._formulas;
	}
}
