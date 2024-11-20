/* eslint-disable @typescript-eslint/no-unused-vars */
import { FeatureBase } from "@/router/feature-base";
import { Metadata } from "./file-wrapper";
import { CachedMetadata, TFile } from "obsidian";
import { ABase } from "@/router/mixin-constrained";
// import { derivedID } from "@/router/mixin-constrained";
/**
 * This class registers an event listener to auto-update note properties upon changes to metadata.
 */

export const METADATA_MANAGER_SETTINGS = {
	enabled: false,
	autoFormulas: true,
};

export class MetadataManager extends ABase {
	readonly _settings = {
		enabled: false,
		autoFormulas: true,
	};
	private wrappers: Metadata[] = [];

	async onload() {
		this.onFileChange = this.onFileChange.bind(this);
		this.onMetadataChange = this.onMetadataChange.bind(this);
		this.plugin.addCommand({
			id: "metadata-manager",
			name: "Update formulas",
			callback: this.onFileChange,
		});
		this.plugin.registerEvent(
			this.plugin.app.workspace.on(
				"active-leaf-change",
				this.onFileChange
			)
		);
		this.plugin.registerEvent(
			this.plugin.app.metadataCache.on("changed", this.onMetadataChange)
		);
		this.onFileChange();
	}

	private get activeFile() {
		return this.plugin.app.workspace.getActiveFile();
	}

	private get activeWrapper() {
		return this.wrappers.find((f) => f.file.path === this.activeFile?.path);
	}

	onFileChange() {
		this.logger.info("Event | file change: ", this.activeFile?.path);
		if (this.activeFile && !this.activeWrapper)
			this.wrappers.push(new Metadata(this.plugin, this.activeFile));
	}

	onMetadataChange(file: TFile, data: string, metadata: CachedMetadata) {
		this.logger.info("Event | cache change: ", file.path);
		let updated: Metadata | undefined;
		for (const wrapper of this.wrappers) {
			if (!updated && wrapper.file.path === file.path) {
				updated = wrapper;
				wrapper.metadata = metadata;
			}
			if (this.plugin.settings.autoFormulas) wrapper.formulas?.update();
			else if (updated) break;
		}
	}
}
