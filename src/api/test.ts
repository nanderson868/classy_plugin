/* eslint-disable @typescript-eslint/no-unused-vars */
// import { App } from "obsidian";
import { App } from "obsidian";
import { APIProxy } from ".";
import { Logger } from "@/utils/logging";

abstract class TestClass {
	protected log = new Logger().setContext(this);
	constructor(public app: App) {
		this.log.setContext(this);
	}

	abstract run(): Promise<void>;
}

export class ProxyRuntimeTest extends TestClass {
	constructor(app: App) {
		super(app);
	}

	async run() {
		const newProxy = new APIProxy(app)
			.addPath("dv", "dataview.api")
			.addPath("meta", "metadata-menu.api")
			.addPath("templater", "templater-obsidian.templater");

		const { dv, meta, templater } = newProxy.api;
		let k: keyof typeof newProxy.paths;
		for (k in newProxy.paths) {
			this.log.debug(k, newProxy.api[k]);
		}

		// Dataview
		dv.pages('"Notes"');

		// Metadata
		const file = app.workspace.getActiveFile();
		if (!file) throw new Error("No active file found. Aborting.");
		const value = Date.now().toString();
		const name = this.constructor.name;
		const payload = { name, payload: { value } };
		await meta.postNamedFieldsValues(file, [payload]);

		// // Templater
		// templater.current_functions_object.user;
	}
}
