/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { DateTime, Duration } from "luxon";
import {
	Widget,
	type Literal,
	type LiteralType,
	type WrappedLiteral,
	type DataObject,
} from "./value";
import { DEFAULT_QUERY_SETTINGS, type QuerySettings } from "@/settings";

// NOTE: This file is largely taken from the original Obsidian Dataview code. https://github.com/blacksmithgu/obsidian-dataview

/** Convert an arbitrary value into a reasonable, Markdown-friendly string if possible. */
export function toString(
	field: unknown,
	setting: QuerySettings = DEFAULT_QUERY_SETTINGS
	// recursive: boolean = false
): string {
	const wrapped = wrapValue(field as Literal);
	if (!wrapped) return setting.renderNullAs;

	switch (wrapped.type) {
		case "null":
			return setting.renderNullAs;
		case "string":
			return wrapped.value;
		case "number":
		case "boolean":
			return "" + wrapped.value;
		default:
			return "";
		// case "html":
		//     return wrapped.value.outerHTML;
		case "widget":
			return wrapped.value.markdown();
		// case "link":
		//     return wrapped.value.markdown();
		// case "function":
		//     return "<function>";
		// case "array":
		//     let result = "";
		//     if (recursive) result += "[";
		//     result += wrapped.value.map(f => toString(f, setting, true)).join(", ");
		//     if (recursive) result += "]";
		//     return result;
		// case "object":
		//     return (
		//         "{ " +
		//         Object.entries(wrapped.value)
		//             .map(e => e[0] + ": " + toString(e[1], setting, true))
		//             .join(", ") +
		//         " }"
		//     );
		// case "date":
		//     if (wrapped.value.second == 0 && wrapped.value.hour == 0 && wrapped.value.minute == 0) {
		//         return wrapped.value.toFormat(setting.defaultDateFormat);
		//     }

		//     return wrapped.value.toFormat(setting.defaultDateTimeFormat);
		// case "duration":
		//     return renderMinimalDuration(wrapped.value);
	}
}

/** Wrap a literal value so you can switch on it easily. */
export function wrapValue(val: Literal): WrappedLiteral | undefined {
	if (isNull(val)) return { type: "null", value: val };
	else if (isNumber(val)) return { type: "number", value: val };
	else if (isString(val)) return { type: "string", value: val };
	else if (isBoolean(val)) return { type: "boolean", value: val };
	else if (isDuration(val)) return { type: "duration", value: val };
	else if (isDate(val)) return { type: "date", value: val };
	else if (isWidget(val)) return { type: "widget", value: val };
	else if (isArray(val)) return { type: "array", value: val };
	// else if (isLink(val)) return { type: "link", value: val };
	else if (isFunction(val)) return { type: "function", value: val };
	else if (isHtml(val)) return { type: "html", value: val };
	else if (isObject(val)) return { type: "object", value: val };
	else return undefined;
}

/** Recursively map complex objects at the leaves. */
export function mapLeaves(
	val: Literal,
	func: (t: Literal) => Literal
): Literal {
	if (isObject(val)) {
		const result: DataObject = {};
		for (const [key, value] of Object.entries(val))
			result[key] = mapLeaves(value, func);
		return result;
	} else if (isArray(val)) {
		const result: Literal[] = [];
		for (const value of val) result.push(mapLeaves(value, func));
		return result;
	} else {
		return func(val);
	}
}

/** Compare two arbitrary JavaScript values. Produces a total ordering over ANY possible dataview value. */
export function compareValue(
	val1: Literal,
	val2: Literal,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	linkNormalizer?: (link: string) => string
): number {
	// Handle undefined/nulls first.
	if (val1 === undefined) val1 = null;
	if (val2 === undefined) val2 = null;
	if (val1 === null && val2 === null) return 0;
	else if (val1 === null) return -1;
	else if (val2 === null) return 1;

	// A non-null value now which we can wrap & compare on.
	const wrap1 = wrapValue(val1);
	const wrap2 = wrapValue(val2);

	if (wrap1 === undefined && wrap2 === undefined) return 0;
	else if (wrap1 === undefined) return -1;
	else if (wrap2 === undefined) return 1;

	// Short-circuit on different types or on reference equality.
	if (wrap1.type != wrap2.type) return wrap1.type.localeCompare(wrap2.type);
	if (wrap1.value === wrap2.value) return 0;

	switch (wrap1.type) {
		case "string":
			return wrap1.value.localeCompare(wrap2.value as string);
		case "number":
			if (wrap1.value < (wrap2.value as number)) return -1;
			else if (wrap1.value == (wrap2.value as number)) return 0;
			return 1;
		case "null":
			return 0;
		case "boolean":
			if (wrap1.value == wrap2.value) return 0;
			else return wrap1.value ? 1 : -1;
		case "link":
			return 1;
		// let link1 = wrap1.value;
		// let link2 = wrap2.value as Link;
		// let normalize = linkNormalizer ?? ((x: string) => x);

		// // We can't compare by file name or display, since that would break link equality. Compare by path.
		// let pathCompare = normalize(link1.path).localeCompare(normalize(link2.path));
		// if (pathCompare != 0) return pathCompare;

		// // Then compare by type.
		// let typeCompare = link1.type.localeCompare(link2.type);
		// if (typeCompare != 0) return typeCompare;

		// // Then compare by subpath existence.
		// if (link1.subpath && !link2.subpath) return 1;
		// if (!link1.subpath && link2.subpath) return -1;
		// if (!link1.subpath && !link2.subpath) return 0;

		// Since both have a subpath, compare by subpath.
		// return (link1.subpath ?? "").localeCompare(link2.subpath ?? "");
		case "date":
			return wrap1.value < (wrap2.value as DateTime)
				? -1
				: wrap1.value.equals(wrap2.value as DateTime)
				? 0
				: 1;
		case "duration":
			return wrap1.value < (wrap2.value as Duration)
				? -1
				: wrap1.value.equals(wrap2.value as Duration)
				? 0
				: 1;
		case "array":
			const f1 = wrap1.value;
			const f2 = wrap2.value as any[];
			for (
				let index = 0;
				index < Math.min(f1.length, f2.length);
				index++
			) {
				const comp = compareValue(f1[index], f2[index]);
				if (comp != 0) return comp;
			}
			return f1.length - f2.length;
		case "object":
			const o1 = wrap1.value;
			const o2 = wrap2.value as Record<string, any>;
			const k1 = Array.from(Object.keys(o1));
			const k2 = Array.from(Object.keys(o2));
			k1.sort();
			k2.sort();

			const keyCompare = compareValue(k1, k2);
			if (keyCompare != 0) return keyCompare;

			for (const key of k1) {
				const comp = compareValue(o1[key], o2[key]);
				if (comp != 0) return comp;
			}

			return 0;
		case "widget":
		case "html":
		case "function":
			return 0;
	}
}

/** Find the corresponding Dataveiw type for an arbitrary value. */
export function typeOf(val: any): LiteralType | undefined {
	return wrapValue(val)?.type;
}

/** Determine if the given value is "truthy" (i.e., is non-null and has data in it). */
export function isTruthy(field: Literal): boolean {
	const wrapped = wrapValue(field);
	if (!wrapped) return false;

	switch (wrapped.type) {
		case "number":
			return wrapped.value != 0;
		case "string":
			return wrapped.value.length > 0;
		case "boolean":
			return wrapped.value;
		case "link":
			return !!wrapped.value.path;
		case "date":
			return wrapped.value.toMillis() != 0;
		case "duration":
			return wrapped.value.as("seconds") != 0;
		case "object":
			return Object.keys(wrapped.value).length > 0;
		case "array":
			return wrapped.value.length > 0;
		case "null":
			return false;
		case "html":
		case "widget":
		case "function":
			return true;
	}
}

/** Deep copy a field. */
export function deepCopy<T extends Literal>(field: T): T {
	if (field === null || field === undefined) return field;

	if (isArray(field)) {
		return ([] as Literal[]).concat(field.map((v) => deepCopy(v))) as T;
	} else if (isObject(field)) {
		const result: Record<string, Literal> = {};
		for (const [key, value] of Object.entries(field))
			result[key] = deepCopy(value);
		return result as T;
	} else {
		return field;
	}
}

export function isString(val: any): val is string {
	return typeof val == "string";
}

export function isNumber(val: any): val is number {
	return typeof val == "number";
}

export function isDate(val: any): val is DateTime {
	return val instanceof DateTime;
}

export function isDuration(val: any): val is Duration {
	return val instanceof Duration;
}

export function isNull(val: any): val is null | undefined {
	return val === null || val === undefined;
}

export function isArray(val: any): val is any[] {
	return Array.isArray(val);
}

export function isBoolean(val: any): val is boolean {
	return typeof val === "boolean";
}

// export function isLink(val: any): val is Link {
//     return val instanceof Link;
// }

export function isWidget(val: any): val is Widget {
	return val instanceof Widget;
}

export function isHtml(val: any): val is HTMLElement {
	if (typeof HTMLElement !== "undefined") {
		return val instanceof HTMLElement;
	} else {
		return false;
	}
}

/** Checks if the given value is an object (and not any other dataview-recognized object-like type). */
export function isObject(val: any): val is Record<string, any> {
	return (
		typeof val == "object" &&
		!isHtml(val) &&
		!isWidget(val) &&
		!isArray(val) &&
		!isDuration(val) &&
		!isDate(val) &&
		// !isLink(val) &&
		val !== undefined &&
		!isNull(val)
	);
}

export function isFunction(val: any): val is Function {
	return typeof val == "function";
}
