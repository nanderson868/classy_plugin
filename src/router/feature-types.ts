/* eslint-disable @typescript-eslint/no-unused-vars */
import { MetadataManager } from "@/features/metadata/metadata-manager";
import { DiscreteMode } from "@/features/privacy/discrete-mode";
import { expectTypeOf } from "expect-type";
import { TestFeatureA, TestFeatureB } from "./feature-base";
import { READONLY } from "./feature.utils";

/**
 * @description
 * This is the single source of truth for the feature list.
 * It is used to dynamically create the feature map and the settings object.
 */

export const FEATURES = [
	TestFeatureA,
	TestFeatureB,
	MetadataManager,
	DiscreteMode,
] as const;

export type FeatureClass = (typeof FEATURES)[number];
export type FeaturePrototype = FeatureClass["prototype"];
export type FeatureAlias = FeaturePrototype[typeof READONLY.alias];

/**
 * @description
 * A map of feature aliases to their classes (constructors)
 */
type FeatureMap = {
	[K in FeaturePrototype[typeof READONLY.alias]]: Extract<
		FeatureClass,
		{ prototype: { [READONLY.alias]: K } }
	>;
};

function extractClassMap<T extends FeatureClass[], U extends FeatureMap>(
	features: T
): U {
	return features.reduce((acc, cls) => {
		if (READONLY.alias in cls.prototype) {
			const alias = cls.prototype[READONLY.alias] as keyof U;
			acc[alias] = cls as U[typeof alias];
		} else console.warn(`Invalid alias: ${cls.name}`);
		return acc;
	}, {} as U);
}

export const DEFAULT_FEATURES = extractClassMap([...FEATURES]);
type FeatureMapResult = typeof DEFAULT_FEATURES;
expectTypeOf<FeatureMapResult>().toBeObject();

/**
 * @description
 * A map of feature aliases to their settings.
 */
type KeyMap<K extends keyof FeaturePrototype> = {
	[key in FeaturePrototype as key[typeof READONLY.alias]]: key[K];
};

function extractPropertyMap<
	T extends FeatureClass[],
	K extends keyof FeaturePrototype,
	U extends KeyMap<K>
>(features: T, key: K): U {
	return features.reduce((acc, cls) => {
		if (READONLY.alias in cls.prototype) {
			const alias = cls.prototype[READONLY.alias] as keyof U;
			acc[alias] = cls.prototype[key] as U[typeof alias];
		} else console.warn(`Invalid alias: ${cls.name}`);
		return acc;
	}, {} as U);
}

export const DEFAULT_SETTINGS = extractPropertyMap(
	[...FEATURES],
	READONLY.settings
);

type SettingsMapResult = typeof DEFAULT_SETTINGS;
expectTypeOf<SettingsMapResult>().toBeObject();
