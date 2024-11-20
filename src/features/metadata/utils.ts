/**
 * Filter properties to include only getters that are defined on the prototype (i.e., the subclass itself)
 */
export function extractFormulas<T>(obj: T): Array<keyof T> {
	const properties: Array<keyof T> = [];
	const prototype = Object.getPrototypeOf(obj);
	if (!prototype) return properties;
	const propNames = Object.getOwnPropertyNames(prototype);
	propNames.forEach((prop) => {
		const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
		if (descriptor && typeof descriptor.get === "function") {
			properties.push(prop as keyof T);
		}
	});
	return properties;
}

// Utility function to perform deep comparison of arrays
export function deepEquals<T>(a: T, b: T): boolean {
	if (a === b) return true;
	if (typeof a !== typeof b || a == null || b == null) return false;
	if (typeof a !== "object") return a === b; // Primitive types would have been caught by a === b

	const aObj = a as unknown as Record<string, unknown>;
	const bObj = b as unknown as Record<string, unknown>;

	const keysA = Object.keys(aObj);
	const keysB = Object.keys(bObj);
	if (keysA.length !== keysB.length) return false;

	for (const key of keysA) {
		if (!keysB.includes(key) || !deepEquals(aObj[key], bObj[key]))
			return false;
	}
	return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lowercaseKeys<T extends Record<string, any>>(
	record: T
): { [K in keyof T as Lowercase<string & K>]: T[K] } {
	const newRecord = {} as { [K in keyof T as Lowercase<string & K>]: T[K] };
	for (const key in record) {
		if (Object.prototype.hasOwnProperty.call(record, key)) {
			const lowerKey = key.toLowerCase() as Lowercase<string & keyof T>;
			Object.defineProperty(newRecord, lowerKey, {
				value: record[key],
				enumerable: true,
				configurable: true,
				writable: true,
			});
		}
	}
	return newRecord;
}

// Example usage:
// const originalRecord = { Name: "Alice", Age: 30, Country: "USA" };
// const lowercasedRecord = lowercaseKeys(originalRecord);
// console.log(lowercasedRecord); // { name: "Alice", age: 30, country: "USA" }

/**
 * Retrieves a value from an object using a case-insensitive key lookup.
 * @param obj - The object to search within.
 * @param key - The key to search for (case-insensitive).
 * @returns The value associated with the key, or undefined if not found.
 */
export function extractCaseInsensitive<T>(
	obj: Record<string, unknown>,
	key: string
): T | undefined {
	const lowerKey = key.toLowerCase();
	for (const objKey in obj) {
		if (objKey.toLowerCase() === lowerKey) {
			return obj[objKey] as T;
		}
	}
	return undefined;
}

/**
 * Converts a value to lowercase if it's a string or an array of strings.
 * @param value - The value to convert.
 * @param key - The key associated with the value (for logging purposes).
 * @returns The lowercase value, or the original value if not a string or array of strings.
 */
export function toLowerCaseValue<T extends string | string[]>(
	value: unknown,
	key: string
): T | undefined {
	if (typeof value === "string") {
		return value.toLowerCase() as T;
	} else if (Array.isArray(value)) {
		// Handle array of strings
		const lowercasedArray = value.map((item) => {
			if (typeof item === "string") {
				return item.toLowerCase();
			} else {
				console.warn(
					`Non-string item in array for key "${key}":`,
					item
				);
				return item; // Return the item as-is if it's not a string
			}
		}) as T;
		return lowercasedArray;
	} else {
		console.warn(
			`Value for key "${key}" is not a string or array of strings:`,
			value
		);
		return undefined;
	}
}
