export type Field = {
	field: string;
	value: string;
};

export type FieldOptions = {
	lookup?: Field;
	alias?: string;
};

export type FieldSetting = {
	name: string;
	enabled: boolean;
	options?: FieldOptions;
};
