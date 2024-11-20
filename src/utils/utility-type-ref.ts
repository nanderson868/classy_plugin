/* eslint-disable @typescript-eslint/no-unused-vars */
type Entries<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T][];

const getEntries = <T extends object>(obj: T) =>
	Object.entries(obj) as Entries<T>;
