/* eslint-disable @typescript-eslint/no-unused-vars */
import { readFileSync } from "fs";

import settings from "./settings.json";

import("./settings.json", { assert: { type: "json" } }).then(
	(module) => module.default["Discrete Mode"]
);

// Example usage:
// interface MyData {
// 	name: string;
// 	age: number;
// }

// const data = loadJsonFile<MyData>("path/to/file.json");
