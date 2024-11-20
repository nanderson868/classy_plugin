/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { MetadataManager } from "@/features/metadata/metadata-manager";
import { DiscreteMode } from "@/features/privacy/discrete-mode";
import MyPlugin from "@/main";
import { Logger } from "@/utils/logging";
// import { MetadataMenu } from "@scripts/constants";
import { Plugin } from "obsidian";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetProps<TBase> = TBase extends new (props: infer P) => any ? P : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetInstance<TBase> = TBase extends new (...args: any[]) => infer I
	? I
	: never;

type MergeCtor<A, B> = new (
	props: GetProps<A> & GetProps<B>
) => GetInstance<A> & GetInstance<B>;

/**
 * This is a function that takes a readonly array of strings and returns void.
 * @param args - A readonly array of strings.
 */
declare function fnGood<const T extends readonly string[]>(args: T): void;
const arr = ["a", "b", "c"];
// 'T' is still 'string[]'-- the 'const' modifier has no effect here
fnGood(arr);

class Base {}

/**
 * @description Compose a new class from the Sprite class,
 * with the Mixin Scale applier:
 */
// const EightBitSprite = Scale(Base);
// const flappySprite = new EightBitSprite("Bird");
// flappySprite.setScale(0.8);
// console.log(flappySprite.scale);

/**
 * @description Method Decorator Mixin
 */
function loggedMethod<This, Args extends unknown[], Return>(
	target: (this: This, ...args: Args) => Return,
	context: ClassMethodDecoratorContext<
		This,
		(this: This, ...args: Args) => Return
	>
) {
	const methodName = String(context.name);

	function replacementMethod(this: This, ...args: Args): Return {
		console.log(`LOG: Entering method '${methodName}'.`);
		const result = target.call(this, ...args);
		console.log(`LOG: Exiting method '${methodName}'.`);
		return result;
	}

	return replacementMethod;
}

const SUB_CLASSES = {
	MetadataManager,
	DiscreteMode,
} as const;

type SUB_CLASSES = (typeof SUB_CLASSES)[keyof typeof SUB_CLASSES];

// const x = new SUB_CLASSES.MetadataManager("METADATA_MANAGER");
/**
 * A class which will have the mixins applied on top of:
 */
export abstract class ABase {
	protected logger = new Logger().setContext(this);
	abstract readonly _settings: Record<string, unknown>;
	constructor(protected plugin: MyPlugin) {}

	get settings() {
		return this.plugin.features[this]; // (Guess fix)
		// return this.plugin.settings.features[this];
	}

	// sameAs(other: this) {
	// 	return other.ID === this.ID;
	// }

	// hasName(): this is { ID: string } {
	// 	return this.ID !== undefined;
	// }
}

type FeatureConstructor = GConstructor<ABase>;

const FEATURES = {
	MetadataManager,
	DiscreteMode,
} as const;

function IsFeature(feature: FeatureConstructor): feature is FeatureConstructor {
	return feature instanceof ABase;
}

// function constructFeatures<T extends Record<string, FeatureConstructor>>(
// 	features: T
// ) {
// 	const result = {} as { [K in keyof T]: InstanceType<T[K]> };
// 	for (const key in features) {
// 		result[key] = new features[key]();
// 	}
// 	return result;
// }

/**
 * A type that represents a constructor usedd to extend other classes from.
 * The main responsibility is to declare that the type being passed in is a class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => object;

/**
 * This mixin adds a scale property, with getters and setters for changing it with an encapsulated private property:
 * @param Base - A class to extend from.
 * @returns A class with a scale property.
 */
function Scale<TBase extends Constructor>(Base: TBase) {
	return class Scaling extends Base {
		// Mixins may not declare private/protected properties
		// however, you can use ES2020 private fields
		_scale = 1;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		constructor(...args: any[]) {
			super(...args);
		}

		setScale(scale: number) {
			this._scale = scale;
		}

		get scale(): number {
			return this._scale;
		}
	};
}

// You can create mixins which only work when you have a particular base to build on:

// type SUB_CLASS = (typeof SUB_CLASSES)[number];

// Now we use a generic version which can apply a constraint on
// the class which this mixin is applied to
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GConstructor<T = object> = new (...args: any[]) => T;

// This allows for creating classes which only work with constrained base classes:
export type Spritable = GConstructor<Base>;
type Loggable = GConstructor<{ print: () => void }>;
type Positionable = GConstructor<{ setPos: (x: number, y: number) => void }>;

/**
 * @description Class Mixin
 * This is a factory function that returns a mixin class
 * This mixin will only work if it is passed a base class which has setPos defined because of the Positionable constraint.
 * @param Base - A base class that has a setPos method.
 * @returns A class that has a setPos method.
 */

function derived<TBase extends Spritable>(Base: TBase) {
	return class Derived extends Base {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		constructor(...args: any[]) {
			super(...args);
		}
	};
}

const Derived = derived(Base);

const d = new Derived();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AConstructor<T = object> = abstract new (...args: any[]) => T;

// type Feature<T> = T extends typeof ABase ? T : never;

// declare const features: Features<typeof SUB_CLASSES>;
// declare const plugin: ClassyPlugin;

// type FF = (typeof features)[keyof typeof features];

// const f1 = new features.DiscreteMode(plugin);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type CBase<T> = T extends new (...args: any[]) => ABase ? T : never;

// function IsNotAbstract<T extends abstract new (...args: any[]) => ABase>(
// 	arg: T
// ): arg is T {
// 	return arg.prototype instanceof ABase;
// }

// interface IFeature {
// 	_dependencies?: FeatureName[];
// 	_settings: Record<string, unknown>;
// }

// This allows for creating classes which only work with constrained base classes:
// export type Feature = AConstructor<ABase>;
// function ADerived<TBase extends Feature>(base: TBase) {
// 	return class ADerived extends base {
// 		// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 		constructor(...args: any[]) {
// 			super(...args);
// 		}
// 	};
// }

// const DerivedConstructor = derived(MetadataManager);
// const DerivedInstance = new DerivedConstructor(Plugin);

// DerivedInstance.setPos(1, 2);
// DerivedInstance.print();

/**
 * This is a type that has a property that is a readonly array of strings.
 */
type HasNames = { names: readonly string[] };
function getNamesExactly<const T extends HasNames>(arg: T): T["names"] {
	return arg.names;
}

// Inferred type: readonly ["Alice", "Bob", "Eve"]
// Note: Didn't need to write 'as const' here
const names = getNamesExactly({ names: ["Alice", "Bob", "Eve"] });
// ^?

/**
 * @mixes
 * This is a function that returns a class that has a static property of type T.
 * The class expression pattern creates singletons, so they can’t be mapped at the type system to support different variable types.
 * You can work around this by using functions to return your classes which differ based on a generic:
 * @returns A class with a static property of type T.
 */
function base<T>() {
	class Base {
		static prop: T;
	}
	return Base;
}

/**
 * This is a function that returns a class that has a static property of type T.
 * @returns A class with a static property of type T.
 */
// export function derivedID<T>(ID: T) {
// 	return class Derived extends Base<T> {};
// }

// class Foo extends derivedID<"foo">() {}
// class Bar extends derivedID<"bar">() {}

// Foo.prop; // "foo"
// Foo.anotherProp; // "foo"
// Bar.prop; // "bar"
// Bar.anotherProp; // "bar"
