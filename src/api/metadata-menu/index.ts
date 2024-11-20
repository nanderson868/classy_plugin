import { TFile } from "obsidian";

export type FieldPayload = {
	value: string | string[]; // the field's value as string
};

export type FieldsPayload = Array<{
	indexedPath: string; //the indexedPath of the field
	payload: FieldPayload;
}>;

export type NamedFieldPayload = {
	name: string; //the name of the field
	payload: FieldPayload;
};

export type NamedFieldsPayload = Array<{
	name: string; //the name of the field
	payload: FieldPayload;
}>;

export interface MetadataMenuAPI {
	api: {
		postNamedFieldsValues: (
			fileOrFilePath: TFile | string,
			payload: NamedFieldsPayload,
			lineNumber?: number,
			asList?: boolean,
			asBlockquote?: boolean
		) => Promise<void>;
		postValues(
			fileOrFilePath: TFile | string,
			payload: FieldsPayload,
			lineNumber?: number,
			after?: boolean,
			asList?: boolean,
			asBlockquote?: boolean
		): Promise<void>;
		fieldModifier(
			dv: unknown,
			p: unknown,
			fieldName: string,
			attrs?: { cls: string; attr: Record<string, string> }
		): HTMLElement;
	};
}
