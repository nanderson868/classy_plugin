import MyPlugin from "@/main";
import { Logger } from "@/utils/logging";
// import { MUTABLE, READONLY } from "./feature.utils";
import { FeatureAlias } from "./feature-types";
abstract class ContextBase {
	protected logger = new Logger().setContext(this);
	constructor(protected plugin: MyPlugin) {}
}

const KEYS = ["alias", "settings", "dependencies"] as const;

enum ENUMS {}

const CONSTANTS = {
	[ALIAS]: ALIAS.toString(),
	SETTINGS: ALIAS.toString() as "settings",
	DEPENDENCIES: ALIAS.toString() as "dependencies",
} as const;

type IFeatureSettings = [
	typeof ALIAS,
	typeof CONSTANTS.SETTINGS,
	typeof CONSTANTS.DEPENDENCIES
];

interface IFeature<T extends IFeatureSettings> extends IFeatureSettings {
	readonly [ALIAS]: unique symbol;
	readonly [CONSTANTS.SETTINGS]: IFeatureSettings;
	readonly [CONSTANTS.DEPENDENCIES]: IFeatureSettings;
	onload: () => Promise<void> | void;
	new: (
		plugin: MyPlugin,
		...args: Parameters<IFeature<T>["onload"]>
	) => IFeature<T>["new"];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testConst = {
	[CONSTANTS.ALIAS]: "asnewweew",
	onload: () => Promise.resolve(),
	new: (plugin: MyPlugin) =>
		new (testConst as IFeatureSettings[0])(plugin),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testConst2 = {
	[CONSTANTS.ALIAS]: "boofamsameomf",
	new: (plugin: MyPlugin) => {
		return {
			test: "test",
		};
	},
};

export abstract class FeatureBase extends ContextBase implements IFeature {
	abstract readonly [CONSTANTS.ALIAS]: FeatureAlias;
	abstract readonly [CONSTANTS.SETTINGS]: IFeature["_settings"];
	readonly [CONSTANTS.DEPENDENCIES]: IFeature["_dependencies"];

	get [CONSTANTS.ALIAS](): this[typeof CONSTANTS.ALIAS] {
		return this[CONSTANTS.ALIAS];
	}
	testProperty: string = "test";

	get [CONSTANTS.SETTINGS]() {
		if (!this.alias) throw new Error("Feature name is undefined");
		if (!(this.alias in this.plugin.settings.features))
			throw new Error(`Feature ${this.alias} settings DNE`);
		const settings = this.plugin.settings.features[this.alias];
		if (!settings) throw new Error(`Settings ${this.alias} DNE`);
		return settings;
	}

	get [MUTABLE.dependencies]() {
		return this[READONLY.dependencies];
	}

	abstract onload?(): Promise<void> | void;

	constructor(protected plugin: MyPlugin) {
		super(plugin);
	}
}

// / E.X is constant:
enum E {
	X,
}

enum LogLevel {
	ERROR,
	WARN,
	INFO,
	DEBUG,
}

type LogLevelStrings = keyof typeof LogLevel;

enum ALIASES {
	FEATURE_A = "Feature A",
	FEATURE_B = "Feature B",
	settings = "settings",
	dependencies = "dependencies",
}

enum SETTINGS {
	enabled = "enabled",
	settingA1 = "settingA1",
}

abstract class NewBaseClass {
	static readonly [ALIAS: keyof typeof ALIASES]:
}

export class TestFeatureA extends FeatureBase {
	static readonly [ALIASES.FEATURE_A]: unique symbol = Symbol("Feature A");
	static readonly [ALIASES.DEPENDENCIES]: Array<ALIASES> = [];
	static readonly [SETTINGS.settings] = {
		enabled: false,
		settingA1: true,
	};

	onload(): Promise<void> {
		return Promise.resolve();
	}
}

export class TestFeatureB extends FeatureBase {
	readonly [READONLY.alias] = "Class B";
	readonly [READONLY.settings] = {
		enabled: false,
		settingB1: "sampleB1",
	};

	onload(): Promise<void> {
		return Promise.resolve();
		this.
	}
}
