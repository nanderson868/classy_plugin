import { FEATURES, TFeature } from "./mixins";

/* eslint-disable @typescript-eslint/no-unused-vars */
function getNamedConfig<const T extends Record<string, TFeature>>(config: T) {
	const result = {} as { [K in keyof T as T[K]["prototype"]["name"]]: T[K] };
	for (const key in config) result[key] = config[key]["prototype"]["name"];
	return result;
}

const namedConfig = getNamedConfig(FEATURES);

export type DeepPartial<T> = T extends object
	? { -readonly [P in keyof T]?: DeepPartial<T[P]> }
	: T;
