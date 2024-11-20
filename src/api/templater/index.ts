export interface TemplaterAPI {
	templater: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		current_functions_object: Record<string, (...args: any[]) => any>;
	};
}
