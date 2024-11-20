/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

enum Config {
	Red,
	Green,
	Blue,
}

const testX = <T>(x: T): T => x;

enum ConfigRecord {
	Red = "RED",
	Green = "GREEN",
	Blue = "BLUE",
}

abstract class ATemplate<T> {
	abstract dependencies: T;
}

function configure<
	const All,
	const Selected extends new (...args: any[]) => ATemplate<keyof All>
>(
	ALL: All,
	settings: Record<keyof All, boolean>,
	classes: Record<keyof All, Selected>
): void {
	return;
}

enum CR {
	A,
	B,
	C,
}

class A {
	readonly dependencies = "A";
}

class B {
	readonly dependencies = "B";
}

class C {
	readonly dependencies = "C";
}

const CONFIG = configure(
	CR,
	{
		A: true,
		B: true,
		C: true,
	},
	{ A, B, C }
);

type testSettings = {
	Red: false;
	Green: true;
	Blue: false;
};

type extractTrue<T> = {
	[K in keyof T as T[K] extends true ? K : never]: K;
};

type x = extractTrue<testSettings>;

type Extract<T, U> = T extends U ? U : never;

type Red = Extract<testSettings, { Red: false }>;
type Green = Extract<testSettings, { Green: true }>;
type Blue = Extract<testSettings, { Blue: false }>;

type SkipRed = Extract<testSettings, { Red: true }>;
type SkipGreen = Extract<testSettings, { Green: false }>;
type SkipBlue = Extract<testSettings, { Blue: true }>;

// type NotRed = Extract<testSettings, { Red: never }>;
// type NotGreen = Extract<testSettings, { Green: never }>;
// type NotBlue = Extract<testSettings, { Blue: never }>;

// console.log("stringKey", stringKey);

const chooseKeys = <T extends keyof typeof Config>(...c: T[]) =>
	c.map((x) => x);

const chosenKeys = chooseKeys("Red", "Green", "Blue");

const allKeys = chooseKeys(
	...Object.entries(Config).map(([k]) => k as keyof typeof Config)
);

console.log("all keys: ", allKeys);

const extractEnumKeys = <T, U extends keyof T>(
	enumObj: T extends { [K in keyof T & U]: T[K] } ? T : never
) => Object.keys(enumObj).filter((x) => isNaN(Number(x))) as U[];

const extractedKeys = extractEnumKeys(ConfigRecord);
console.log("extractedKeys", extractedKeys);

// enum Color2 {
// 	Red,
// 	Green,
// 	Blue,
// }

const stringEnumToArray = <T extends COLORS>(enumObj: {
	[K in T & keyof T]: T;
}) => Object.values(enumObj);

const colors = stringEnumToArray(ConfigRecord);
console.log("stringEnumToArray", colors);

const colors2 = extractEnumKeys(Config);

console.log("colors2", colors2);

type COLORS = keyof typeof ConfigRecord;

const selection = chooseKeys("Red", "Green", "Blue");

const keys = Object.keys(Config).filter((x) => isNaN(Number(x)));

console.log("keys", keys);

console.log("selection", selection);

// console.log("all", allColors);
