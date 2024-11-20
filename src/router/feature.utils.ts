/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FeatureBase } from "./feature-base";
type Constructor<T> = new (...args: any[]) => T;

// type PrefixedProperties<T> = {
// 	[K in keyof T]: `_${K}`;
// };

// /**
//  * Standardizes the feature factory class.
//  * This class is responsible for constructing and loading features.
//  */
// export class FeatureFactory extends Plugin {
// 	// private features: FeatureInstances = [];
// 	// private allFeatures = [DiscreteMode, MetadataManager];
// 	// private featureSettings = this.allFeatures.forEach((feature) => {
// 	// 	this.settings.features[feature.prototype.name] =
// 	// 		feature.prototype._settings;
// 	// });

// 	onload() {
// 		// Construct and load features
// 		// let feature: keyof typeof this.settings.features;
// 		// for (feature in this.settings.features) {
// 		// 	if (this.settings.features[feature].enabled)
// 		// 		new FEATURES[feature](plugin);
// 		// }
// 		// await Promise.all(this.features.map((feature) => feature.onload()));
// 	}
// }

const UNIQUE_ALIAS: unique symbol = Symbol("a");

const a1: typeof UNIQUE_ALIAS = UNIQUE_ALIAS;
const a2: typeof UNIQUE_ALIAS = UNIQUE_ALIAS;

const NORMAL_ALIAS: symbol = Symbol("b");
const b1: typeof NORMAL_ALIAS = NORMAL_ALIAS;
const b2: typeof NORMAL_ALIAS = NORMAL_ALIAS;

const base: Class<{ isBase: true }>;
class Child extends Base {}
function bar<T extends Base>(C: Class<T>) {} // Accepts any class that extends Base
abstract class EmptyAbstractClass {}
type Class<T = object> = typeof EmptyAbstractClass & { prototype: T };

abstract class Utils {
	static getObjectKeys<T extends object>(obj: T): Array<keyof T> {
		return Object.keys(obj) as Array<keyof T>;
	}
}
/**
 * @description Helper interface for accessing properties and methods of a class.
 */
interface ClassWrapper<T extends typeof FeatureBase> extends Utils {
	readonly class: T;
	readonly subclasses: T[];
	readonlyKeys<K extends keyof T, P extends string>(
		keys: K[],
		prefix: P
	): {
		[Key in keyof T as Key extends `${P}${infer J}`
			? `${P}${J}`
			: never]: T[Key];
	};
}

/**
 * @description
 * Helper class for accessing properties and methods of a class.
 */
abstract class FeatureUtilities<T extends typeof FeatureBase, C extends T>
	implements ClassWrapper<T>
{
	abstract readonly class: T;
	abstract readonly subclasses: C[];

	readonly<K extends keyof T, P extends string>(keys: K[], prefix: P) {
		return keys.reduce((acc, key) => {
			if (typeof key !== "string") return acc;
			const newKey = `${prefix}${key}` as keyof T extends `${P}${infer J}`
				? `${P}${J}`
				: never;
			if (newKey in acc)
				acc[newKey] = Object.getPrototypeOf(this.class).prototype[key];
			return acc;
		}, {} as { [Key in keyof T as Key extends `${P}${infer J}` ? `${P}${J}` : never]: T[Key] });
	}

	get proto() {
		return FeatureBase.prototype;
	}

	get keys() {
		return Object.keys(this.proto) as (keyof InstanceType<T>)[];
	}

	// get prefixedKeys() {
	// 	return prefixKeys(this.proto, this.keys, "_");
	// }

	// Type
	// '{ [Key in keyof InstanceType<T> & string]: `_${Key}`; }' is not assignable to type
	// '{ [K in keyof InstanceType<T> as K extends string ? `_${K}` : K]: InstanceType<T>[K]; }'.

	get properties() {
		return Object.keys(this.class.prototype).reduce((acc, key) => {
			if (key !== "constructor" && key in this.class) {
				acc[key] = this.class[key];
			}
			return acc;
		}, {} as { [K in keyof T]: T[K] })["prototype"];
	}

	get methods() {
		return new Proxy({} as typeof FeatureBase, {
			get: (target, prop: string) => {},
		}) as {
			[K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
		};
	}

	//  {
	// 	return new Proxy(this.class.prototype, {
	// 		get: (target, prop: string) => {
	// 			return this.class.prototype[
	// 				prop as keyof typeof this.class.prototype
	// 			];
	// 		},
	// 	});
	// 	(acc, [key, value]) => {
	// 		if (typeof value === "function" && key !== "constructor") {
	// 			acc[key as keyof T] = value;
	// 		}
	// 		return acc;
	// 	},
	// 	{} as {
	// 		[K in keyof T]: T[K] extends (...args: any[]) => any
	// 			? T[K]
	// 			: never;
	// 	}
	// );
	// }

	test() {
		typeof FeatureBase.prototype;
	}
}

// class Foo extends FeatureUtilities<typeof TestFeatureA> {
// 	class = TestFeatureA;
// 	subclasses: [] = [];

// FeatureBase.prototype.

// data: unknown;
// isLoading: IsLoadingRecord<FeatureUtilities<T>> = {};
// static readonly READONLY_PREFIX = "_";

// fetchData() {
// 	this.isLoading = {
// 		fetchData: true,
// 	};
// 	try {
// 		// ...
// 	} catch (e) {
// 		console.error(e);
// 	} finally {
// 		this.isLoading = {};
// 	}
// }

// static getMethodNames<T extends FeatureBase = FeatureBase>(
// 	ctor: AbstractConstructor<T>
// ): MethodNames<T>[] {
// 	const proto = ctor.prototype;
// 	const methodNames = Object.getOwnPropertyNames(proto).filter(
// 		(name) =>
// 			typeof proto[name] === "function" && name !== "constructor"
// 	);
// 	return methodNames as MethodNames<T>[];
// }

// static get subclasses() {
// 	return new Proxy({} as typeof DEFAULT_FEATURES, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static get proto() {
// 	return new Proxy({} as FeaturePrototype, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static get instance() {
// 	return new Proxy({} as ExtractInstanceType<FeatureBase>, {
// 		get: (target, prop: string) => {},
// 	});
// }
// static get properties() {
// 	return new Proxy({} as Partial<FeatureBase>, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static get methodNames() {
// 	return FeatureUtilities.getMethodNames(Object.getPrototypeOf(this));
// }

// static get methodNamesFake(): (typeof FeatureUtilities.methodNames)[number] {
// 	return [] as unknown as (typeof FeatureUtilities.methodNames)[number];
// }

// static get methods() {
// 	return new Proxy({} as ExtractMethods<FeatureBase>, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static get getReadonlyKeys() {
// 	return prefixKeys(
// 		FeatureUtilities.READONLY_PREFIX,
// 		Object.keys(FeatureUtilities.subclasses)
// 	);
// }

// static get readonlyProps() {
// 	return new Proxy({} as typeof FeatureUtilities.getReadonlyKeys, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static get mutableProps() {
// 	return new Proxy({} as Partial<FeatureBase>, {
// 		get: (target, prop: string) => {},
// 	});
// }

// static getPropKeys() {
// 	return Object.getOwnPropertyNames(
// 		FeatureUtilities.class.prototype
// 	) as (keyof typeof FeatureUtilities.class.prototype)[];
// }

// const PrototypeKeys = FeatureUtilities.getPropKeys();
// const BaseKeys = prefixKeys("_", FeatureUtilities.getPropKeys());

/**
 * @description
 * Helper function to get the method names of a given object.
 */

// eslint-disable-next-line @typescript-eslint/ban-types
type ClassMethods<T> = KeyOfType<T, Function>;
export type IsLoadingRecord<Type> = Partial<
	Record<ClassMethods<Omit<Type, "isLoading">>, boolean>
>;

type MethodNames<T> = {
	[K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

export type KeyOfType<Type, ValueType> = keyof {
	[Key in keyof Type as Type[Key] extends ValueType ? Key : never]: unknown;
};

type ExtractInstanceType<T> = T extends new (...args: never[]) => infer R
	? R
	: T extends { prototype: infer P }
	? P
	: never;

type ExtractMethods<T> = Pick<T, MethodNames<T>>;

type AbstractConstructor<T> = abstract new (...args: never[]) => T;
