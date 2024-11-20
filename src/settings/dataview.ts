/**
 * From Dataview
 */
export interface QuerySettings {
	defaultDateFormat: string;
	defaultDateTimeFormat: string;
	maxRecursiveRenderDepth: number;
	/** What to render 'null' as in tables. Defaults to '-'. */
	renderNullAs: string;
	/** Include the result count as part of the output. */
	showResultCount: boolean;
}

export const DEFAULT_QUERY_SETTINGS: QuerySettings = {
	renderNullAs: "\\-",
	showResultCount: true,
	defaultDateFormat: "MMMM dd, yyyy",
	defaultDateTimeFormat: "MMMM dd, yyyy, HH:mm",
	maxRecursiveRenderDepth: 0,
};
