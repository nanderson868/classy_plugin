/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Literal } from "@/api/dataview/data-model/value";
import { DataArray } from "@/api/dataview/data-model/data-array";
// import { Link, Page } from "@/types/plugins.ts/api";
import { Component } from "obsidian";
import { DateTime } from "luxon";
import { Task } from "@/features/tasks/view-tasks";

export type Page = Record<string, Literal> & {
	file: File;
	tags: string[];
} & {
	[key: string]: any;
};

export interface DataviewAPI {
	api: {
		pages: (source?: string) => DataArray<Page>;
		page: (path: string | Link, originFile?: string) => Page | undefined;
		equal(a: any, b: any): boolean;
		parse(arg0: string): void;
		fileLink(arg0: any, embed?: boolean, displayName?: string): void;
		date(arg0: string): void;
		table(arg0: string[], arg1: any): void;
		list(
			values: any[] | DataArray<any> | undefined,
			container: HTMLElement,
			component: Component,
			filePath: string
		): void;
	};
}

export type Link = {
	path: string;
};

/**
 *
 */
export type ListItem = {
	tatus: string;
	checked: boolean;
	completed: boolean;
	fullyCompleted: boolean;
	text: string;
	visual: string;
	line: number;
	lineCount: number;
	path: string;
	section: Link;
	tags: string[];
	outlinks: string[];
	link: Link;
	children: ListItem[];
	task: boolean;
	annotated: boolean;
	parent: number;
	blockId: string;
};

// export type Link = any

export type FrontMatterField = {
	[key: string]: any;
};

/**
 * @link https://blacksmithgu.github.io/obsidian-dataview/annotation/metadata-pages/
 */
export type File = {
	name: string;
	folder: string;
	path: string;
	ext: string;
	link: Link;
	size: number;
	ctime: DateTime;
	cday: DateTime;
	mtime: DateTime;
	mday: DateTime;
	tags: string[];
	etags: string[];
	inlinks: string[];
	outlinks: string[];
	aliases: string[];
	tasks: DataArray<Task>;
	lists: string[];
	frontmatter: FrontMatterField[];
	day: DateTime;
	starred: boolean;
};

// export type Page = {
// 	[key: string]: any;
// 	file: File;
// };
