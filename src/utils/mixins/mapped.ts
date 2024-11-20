/* eslint-disable @typescript-eslint/no-unused-vars */

import { TypeDataRegistry, TypeRegistry } from "./registry";
import { AbstractConstructor } from "./mapped-generic-types";
// import { DerivedClassA, DerivedClassB } from "./mapped-classes";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ISettings {
	[key: string]: unknown;
}

export abstract class Base<T extends ISettings = ISettings> {
	readonly name = this.constructor.name;
	readonly _settings = {} as T;
	constructor(...args: any[]) {
		console.log("Base constructor");
	}
	async onload() {}
}

export function FeatureMixin<
	T extends ISettings,
	const S extends Readonly<Partial<T>> = Readonly<Partial<T>>
>(base: AbstractConstructor<Base<T>>, defaultSettings: S) {
	return class AFeature extends Base<T> {
		static readonly defaultSettings: S = defaultSettings;
		static readonly settings: T;

		constructor(...args: any[]) {
			super(...args);
			console.log("FeatureMixin constructor");
		}
		get defaultSettings() {
			return AFeature.defaultSettings;
		}

		get settings() {
			return Features.getSettings(AFeature);
		}

		static updateSettings(
			this: abstract new (...args: any[]) => AFeature,
			newSettings: Partial<T>
		) {
			Features.updateSettings(AFeature, newSettings);
		}

		updateSettings(this: this, newSettings: Partial<T>) {
			Features.updateSettings(AFeature, newSettings);
		}
	};
}

type TFeature = ReturnType<typeof FeatureMixin>;

class Features {
	private static data: {
		[key in TFeature["name"]]: TFeature["settings"];
	};
	private static features = new TypeRegistry<Base>();
	private static settings = new Map<TFeature, ISettings>();
	private static settingsNEW = new TypeDataRegistry<Base>();

	public static featureData = this.settingsNEW.get;

	public static getSettings<T extends TFeature>(feature: T): T["settings"] {
		const settings = this.settings.get(feature);
		if (!settings) throw new Error("Feature not found");
		return settings;
	}

	static updateSettings<T extends TFeature, S extends Partial<T["settings"]>>(
		feature: T,
		newSettings: S
	) {
		if (!this.settings.has(feature)) throw new Error("Feature not found");
		this.settings.set(feature, newSettings);
	}

	static get feature() {
		return this.features.get;
	}

	static register(feature: TFeature) {
		const settings = this.data[feature.name];
		if (!settings) throw new Error("Settings not found");
		this.settings.set(feature, {
			...feature.defaultSettings,
			...settings,
		});
		this.features.set(feature, new feature());
	}

	static load(constructors: TFeature[], data: any) {}
}

// Applying the mixin to create derived classes
export class DerivedClassA extends FeatureMixin(
	Base<{
		isKey: number;
		isA: string;
	}>,
	{
		isKey: 42,
		isA: "unique key",
	}
) {
	async onload() {}
}

export class DerivedClassB extends FeatureMixin(
	Base<{
		value: number;
		isB: string;
		autoUpdate: boolean;
	}>,
	{
		value: 84,
		keyB: "unique key",
	}
) {
	async onload() {
		console.log(this.defaultSettings);
	}
}

interface IPlugin {
	onload(): Promise<void>;
	loadData(): Promise<void>;
	saveData(data: any): Promise<void>;
}

// Example usage

class Sample implements IPlugin {
	async onload() {
		Features.register(DerivedClassA);
		Features.register(DerivedClassB);
		Features.load([DerivedClassA, DerivedClassB], this.loadData());

		const classA = Features.feature(DerivedClassA);
		const classB = Features.feature(DerivedClassB);
		if (!classA) throw new Error("Class A not found");
		if (!classB) throw new Error("Class B not found");

		classA.updateSettings({ isA: "new" }); // OK
		classB.updateSettings({ isB: "new" }); // OK

		classA.defaultSettings.isKey satisfies 42; // OK
		// @ts-expect-error Type Type '42' does not satisfy the expected type '20'.ts(1360)
		classA.defaultSettings.isKey satisfies 20; // Expected Error

		classA.settings.isA satisfies string; // OK
		classA.settings.isKey satisfies number; // OK
		// @ts-expect-error Type 'string' does not satisfy the expected type '"custom"'.ts(1360)
		classA.settings.keyA satisfies "custom"; // Expected Error

		classA.updateSettings({ isA: "new" }); // OK
		classA.updateSettings({ isKey: 100 }); // OK
		// @ts-expect-error Type 'number' is not assignable to type 'string'
		classA.updateSettings({ isA: 1 }); // Expected Error
		// @ts-expect-error ... 'foo' does not exist in type 'Partial<{ name: string; value: number; a: string; }>'
		classA.updateSettings({ foo: "bar" }); // Expected Error

		DerivedClassB.updateSettings({ isB: "new" }); // OK
		DerivedClassB.updateSettings({ autoUpdate: false }); // OK
		// @ts-expect-error Type 'number' is not assignable to type 'string'
		DerivedClassB.updateSettings({ isB: 1 }); // Expected Error
		// @ts-expect-error ... 'a' does not exist in type 'Partial<{ value: number; b: string; }>'
		DerivedClassB.updateSettings({ a: "new" }); // Expected Error
	}
	async loadData() {}
	async saveData(data: any) {}
}

// Usage

const sample = new Sample();
sample.onload();
