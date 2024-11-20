/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// NOTE: File appears outdated

import { expectTypeOf } from "expect-type";
import { TFeature1, TFeature2 } from "./features";
import { App, Plugin, PluginSettingTab } from "obsidian";

type ConcreteCtor<T = any> = new (...args: any[]) => T;
type AbstractCtor<T = any> = abstract new (...args: any[]) => T;

type DeepPartial<T> = T extends object
	? { -readonly [P in keyof T]?: DeepPartial<T[P]> }
	: T;

export abstract class TFeatureBase {
	protected readonly id: keyof typeof FEATURES;

	// abstract readonly _settings: Mutable<FEATURES[keyof FEATURES]["SETTINGS"]>;
	// protected settings:
	constructor(public plugin: InstanceType<TPluginDev>, id: string) {
		if (id in FEATURES) this.id = id as keyof FEATURES;
		else throw new Error("Invalid feature id");
	}

	display(): void {}
	onload(): void {}
}

// type Basket = { bananas: 10; apple: number };
// declare const updateBasket: <T extends [ShallowExact<T[0], Partial<Basket>>]>(
// 	...basket: T
// ) => void;

// updateBasket(({ bananas:  }))
// updateBasket(({ bananas: 10, apple: 10 }))
// Type 'number' is not assignable to type 'never'

// type ShallowExact<T, U> = T extends U
// 	? U extends unknown
// 		? { [K in keyof T]: K extends keyof U ? T[K] : never }
// 		: never
// 	: U;

// const asExample = <K extends PropertyKey>(x: {
// 	[P in K]: (name: string) => ConcreteCtor;
// }) => x;

// const config = asExample({
// 	1: () => TFeature1,
// 	2: () => TFeature2,
// });

// config[1]("asdf");

export function BuildFeature<
	const T extends AbstractCtor<TFeatureBase>,
	const S extends Readonly<Record<string, unknown>>,
	const N extends Readonly<string>
>(base: T, settings: S, name: N) {
	abstract class TDerived<X extends Feature["NAME"]> extends base {
		static readonly NAME = name;
		static readonly SETTINGS = settings;
		constructor(...args: any[]) {
			super(...args);
		}

		updateSettings(settings: Partial<S>) {
			this.plugin.updateSettings({ [this.id]: settings });
		}

		get settings() {
			type Tthis = PickByProp<typeof FEATURES, "SETTINGS", S>;
			return "" as Tthis;
			// type idi = PickKeyByProp<typeof FEATURES, "SETTINGS", S>;
			// return name;
			if (!this.plugin.settings)
				throw new Error("Plugin settings not found");
			const settings = this.plugin.fetchSettings(this.id);
			if (settings) return settings;
			throw new Error("Settings not found");
		}

		// set settings(settings: Partial<S>) {
		// 	this._settings = settings;
		// 	this.plugin.settings[this.name];
		// }

		isSettings(settings: any): settings is S {
			return true;
		}

		isMyName(name: string) {
			return this.name === name;
		}

		getName() {
			if (TDerived.NAME) return getByName(TDerived.NAME);
			throw new Error("Feature name not found");
		}

		get name() {
			return TDerived.NAME;
		}
	}
	return TDerived;
}

type FeatureCtor = (...args: any[]) => typeof TFeatureBase;

type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

type Config<T extends Record<string, AbstractCtor>> = {
	[K in keyof T]: ConcreteCtor<InstanceType<T[K]>>;
};

function getClassName<T extends Feature>(ctor: T) {
	return ctor.NAME as PickKeyByProp<FEATURES, "NAME", T["NAME"]>;
}

function getByName<T extends Feature["NAME"]>(name: T) {
	type ctor = PickByProp<FEATURES, "NAME", T>;
	return {} as ctor;
}

export function BuildPlugin<T extends Config<T>>(config: Readonly<T>) {
	abstract class FeatureEnabled extends Plugin {
		private readonly _config = config;

		private _features: Partial<{
			[K in keyof T]: InstanceType<T[K]>;
		}> = {};

		public get features() {
			return this._features;
		}

		private _settings: Partial<{
			[K in keyof T]: InstanceType<T[K]> extends TFeatureBase
				? InstanceType<T[K]>
				: never;
		}> = {};

		public get config() {
			return this._config as unknown as FEATURES;
		}

		onload() {
			this.addSettingTab(new TSettings(this.app, this));
			this.loadSettings();
			this.loadFeatures();
		}

		private async loadSettings() {
			this._settings = Object.assign(
				{ features: this.settings },
				(await this.loadData()) ?? {}
			);
		}
		// {
		// 	readonly [K in keyof typeof FEATURES]: DeepPartial<
		// 		Mutable<FEATURES[K]["SETTINGS"]>
		// 	>;
		public get settings() {
			return this._settings;
		}

		public fetchSettings<T extends keyof FEATURES>(feature: T) {
			if (feature) return this.settings[feature];
		}

		public set settings(settings: DeepPartial<SETTINGS>) {
			// this.updateSettings(settings);
		}

		// public set settings(feature: InstanceType<TDervived>) {
		// 	if (!isFeaturInstance(feature))
		// 		throw new Error("Feature is not concrete");
		// 	const name = feature.getName();
		// 	const settings = feature.settings;
		// 	type S = Mutable<SETTINGS>;
		// 	this.settings[name] = settings;
		// 	this.saveData(this.settings);
		// }

		public async updateSettings(settings: DeepPartial<SETTINGS>) {
			Object.assign(this._settings, settings);
			await this.saveData(this._settings);
		}

		private loadFeatures() {
			for (const key in this._config) {
				const ctor = this._config[key];
				if (!ctor) throw new Error("Invalid constructor");
				const instance = new ctor(this, key);
				this._features[key] = instance;
			}
		}
	}
	return FeatureEnabled;
}

type PickByProp<T, N extends keyof T[keyof T], V> = V extends T[keyof T][N]
	? {
			[K in keyof T as T[K][N] extends V ? K : never]: T[K];
			// eslint-disable-next-line no-mixed-spaces-and-tabs
	  } extends infer J
		? J[keyof J]
		: never
	: never;

type PickKeyByProp<T, N extends keyof T[keyof T], V> = {
	[K in keyof T as T[K][N] extends V ? K : never]: T[K];
} extends infer J
	? keyof J
	: never;

export default class TSettings extends PluginSettingTab {
	constructor(app: App, public plugin: Plugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
	}
}

type TPluginDev = ReturnType<typeof BuildPlugin>;
type TDervived = ReturnType<typeof BuildFeature>;

export const FEATURES = {
	TFeature1,
	TFeature2,
} as const;

type FEATURES = typeof FEATURES;
type SETTINGS = { [K in keyof FEATURES]: FEATURES[K]["SETTINGS"] };
type Feature = FEATURES[keyof FEATURES];

function isFeature(feature: TDervived): feature is Feature {
	return feature instanceof TFeatureBase;
}

function isFeaturInstance(feature: any): feature is InstanceType<Feature> {
	return feature instanceof TFeatureBase;
}

/**
 * Test class
 */
class Sampleton extends BuildPlugin(FEATURES) {
	onload() {
		this.features.TFeature1?.onload();
		this.features.TFeature2?.onload();
		this.updateSettings({ TFeature1: { settingF1: "Setting F1" } });
		this.settings.TFeature2;
	}
}

declare const sample: Sampleton;
