/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */

import { DateTime, Duration } from "luxon";
import * as Values from "./values";

// NOTE: This file is largely taken from the original Obsidian Dataview code. https://github.com/blacksmithgu/obsidian-dataview

/** Shorthand for a mapping from keys to values. */
export type DataObject = { [key: string]: Literal };
/** The literal types supported by the query engine. */
export type LiteralType =
	| "boolean"
	| "number"
	| "string"
	| "date"
	| "duration"
	| "link"
	| "array"
	| "object"
	| "function"
	| "null"
	| "html"
	| "widget";
/** The raw values that a literal can take on. */
export type Literal =
	| boolean
	| number
	| string
	| DateTime
	| Duration
	// | Link
	| Array<Literal>
	| DataObject
	| Function
	| null
	| HTMLElement
	| Widget;

/** A grouping on a type which supports recursively-nested groups. */
export type GroupElement<T> = { key: Literal; rows: Grouping<T> };
export type Grouping<T> = T[] | GroupElement<T>[];

/** Maps the string type to it's external, API-facing representation. */
export type LiteralRepr<T extends LiteralType> = T extends "boolean"
	? boolean
	: T extends "number"
	? number
	: T extends "string"
	? string
	: T extends "duration"
	? Duration
	: T extends "date"
	? DateTime
	: T extends "null"
	? null
	: // : T extends "link"
	// ? Link
	T extends "array"
	? Array<Literal>
	: T extends "object"
	? Record<string, Literal>
	: T extends "function"
	? Function
	: T extends "html"
	? HTMLElement
	: T extends "widget"
	? Widget
	: any;

/** A wrapped literal value which can be switched on. */
export type WrappedLiteral =
	| LiteralWrapper<"string">
	| LiteralWrapper<"number">
	| LiteralWrapper<"boolean">
	| LiteralWrapper<"date">
	| LiteralWrapper<"duration">
	| LiteralWrapper<"link">
	| LiteralWrapper<"array">
	| LiteralWrapper<"object">
	| LiteralWrapper<"html">
	| LiteralWrapper<"widget">
	| LiteralWrapper<"function">
	| LiteralWrapper<"null">;

export interface LiteralWrapper<T extends LiteralType> {
	type: T;
	value: LiteralRepr<T>;
}

///////////////
// Groupings //
///////////////

// export namespace Groupings {
// 	/** Determines if the given group entry is a standalone value, or a grouping of sub-entries. */
// 	export function isElementGroup<T>(
// 		entry: T | GroupElement<T>
// 	): entry is GroupElement<T> {
// 		return (
// 			Values.isObject(entry) &&
// 			Object.keys(entry).length == 2 &&
// 			"key" in entry &&
// 			"rows" in entry
// 		);
// 	}

// 	/** Determines if the given array is a grouping array. */
// 	export function isGrouping<T>(
// 		entry: Grouping<T>
// 	): entry is GroupElement<T>[] {
// 		for (const element of entry) if (!isElementGroup(element)) return false;

// 		return true;
// 	}

// 	/** Count the total number of elements in a recursive grouping. */
// 	export function count<T>(elements: Grouping<T>): number {
// 		if (isGrouping(elements)) {
// 			let result = 0;
// 			for (const subgroup of elements) result += count(subgroup.rows);
// 			return result;
// 		} else {
// 			return elements.length;
// 		}
// 	}
// }

//////////
// LINK //
//////////

// /** The Obsidian 'link', used for uniquely describing a file, header, or block. */
// export class Link {
//     /** The file path this link points to. */
//     public path: string;
//     /** The display name associated with the link. */
//     public display?: string;
//     /** The block ID or header this link points to within a file, if relevant. */
//     public subpath?: string;
//     /** Is this link an embedded link (!)? */
//     public embed: boolean;
//     /** The type of this link, which determines what 'subpath' refers to, if anything. */
//     public type: "file" | "header" | "block";

//     /** Create a link to a specific file. */
//     public static file(path: string, embed: boolean = false, display?: string) {
//         return new Link({
//             path,
//             embed,
//             display,
//             subpath: undefined,
//             type: "file",
//         });
//     }

//     public static infer(linkpath: string, embed: boolean = false, display?: string) {
//         if (linkpath.includes("#^")) {
//             let split = linkpath.split("#^");
//             return Link.block(split[0], split[1], embed, display);
//         } else if (linkpath.includes("#")) {
//             let split = linkpath.split("#");
//             return Link.header(split[0], split[1], embed, display);
//         } else return Link.file(linkpath, embed, display);
//     }

//     /** Create a link to a specific file and header in that file. */
//     public static header(path: string, header: string, embed?: boolean, display?: string) {
//         // Headers need to be normalized to alpha-numeric & with extra spacing removed.
//         return new Link({
//             path,
//             embed,
//             display,
//             subpath: normalizeHeaderForLink(header),
//             type: "header",
//         });
//     }

//     /** Create a link to a specific file and block in that file. */
//     public static block(path: string, blockId: string, embed?: boolean, display?: string) {
//         return new Link({
//             path,
//             embed,
//             display,
//             subpath: blockId,
//             type: "block",
//         });
//     }

//     public static fromObject(object: Record<string, any>) {
//         return new Link(object);
//     }

//     private constructor(fields: Partial<Link>) {
//         Object.assign(this, fields);
//     }

//     /** Checks for link equality (i.e., that the links are pointing to the same exact location). */
//     public equals(other: Link): boolean {
//         if (other == undefined || other == null) return false;

//         return this.path == other.path && this.type == other.type && this.subpath == other.subpath;
//     }

//     /** Convert this link to it's markdown representation. */
//     public toString(): string {
//         return this.markdown();
//     }

//     /** Convert this link to a raw object which is serialization-friendly. */
//     public toObject(): Record<string, any> {
//         return { path: this.path, type: this.type, subpath: this.subpath, display: this.display, embed: this.embed };
//     }

//     /** Update this link with a new path. */
//     //@ts-ignore; error appeared after updating Obsidian to 0.15.4; it also updated other packages but didn't say which
//     public withPath(path: string) {
//         return new Link(Object.assign({}, this, { path }));
//     }

//     /** Return a new link which points to the same location but with a new display value. */
//     public withDisplay(display?: string) {
//         return new Link(Object.assign({}, this, { display }));
//     }

//     /** Convert a file link into a link to a specific header. */
//     public withHeader(header: string) {
//         return Link.header(this.path, header, this.embed, this.display);
//     }

//     /** Convert any link into a link to its file. */
//     public toFile() {
//         return Link.file(this.path, this.embed, this.display);
//     }

//     /** Convert this link into an embedded link. */
//     public toEmbed(): Link {
//         if (this.embed) {
//             return this;
//         } else {
//             let link = new Link(this);
//             link.embed = true;
//             return link;
//         }
//     }

//     /** Convert this link into a non-embedded link. */
//     public fromEmbed(): Link {
//         if (!this.embed) {
//             return this;
//         } else {
//             let link = new Link(this);
//             link.embed = false;
//             return link;
//         }
//     }

//     /** Convert this link to markdown so it can be rendered. */
//     public markdown(): string {
//         let result = (this.embed ? "!" : "") + "[[" + this.obsidianLink();

//         if (this.display) {
//             result += "|" + this.display;
//         } else {
//             result += "|" + getFileTitle(this.path);
//             if (this.type == "header" || this.type == "block") result += " > " + this.subpath;
//         }

//         result += "]]";
//         return result;
//     }

//     /** Convert the inner part of the link to something that Obsidian can open / understand. */
//     public obsidianLink(): string {
//         const escaped = this.path.replaceAll("|", "\\|");
//         if (this.type == "header") return escaped + "#" + this.subpath?.replaceAll("|", "\\|");
//         if (this.type == "block") return escaped + "#^" + this.subpath?.replaceAll("|", "\\|");
//         else return escaped;
//     }

//     /** The stripped name of the file this link points to. */
//     public fileName(): string {
//         return getFileTitle(this.path).replace(".md", "");
//     }
// }

/////////////////
// WIDGET BASE //
/////////////////

/**
 * A trivial base class which just defines the '$widget' identifier type. Subtypes of
 * widget are responsible for adding whatever metadata is relevant. If you want your widget
 * to have rendering functionality (which you probably do), you should extend `RenderWidget`.
 */
export abstract class Widget {
	// key(app: App, key: any, container: HTMLElement, originFile: string, component: Component, settings: QuerySettings, expandList: boolean, context: ValueRenderContext, depth: number, isInlineFieldLivePreview: boolean) {
	//     throw new Error("Method not implemented.");
	// }
	// url: string;
	// display: string;
	// value: Literal;
	public constructor(public $widget: string) {}

	/**
	 * Attempt to render this widget in markdown, if possible; if markdown is not possible,
	 * then this will attempt to render as HTML. Note that many widgets have interactive
	 * components or difficult functional components and the `markdown` function can simply
	 * return a placeholder in this case (such as `<function>` or `<task-list>`).
	 */
	public abstract markdown(): string;
}

/** A trivial widget which renders a (key, value) pair, and allows accessing the key and value. */
export class ListPairWidget extends Widget {
	public constructor(public key: Literal, public value: Literal) {
		super("dataview:list-pair");
	}

	public override markdown(): string {
		return `${Values.toString(this.key)}: ${Values.toString(this.value)}`;
	}
}

/** A simple widget which renders an external link. */
export class ExternalLinkWidget extends Widget {
	public constructor(public url: string, public display?: string) {
		super("dataview:external-link");
	}

	public override markdown(): string {
		return `[${this.display ?? this.url}](${this.url})`;
	}
}
