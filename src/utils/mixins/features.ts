import { BuildFeature, TFeatureBase } from "./mixins";

// NOTE: File appears outdated

export class TFeature1 extends BuildFeature(
	TFeatureBase,
	{
		settingF1: "Setting F1",
		autoUpdate: true,
	},
	"This is Feature 1"
) {
	onload(): void {
		console.log("name");
		this.settings;
		const x = this.name;
	}
}

export class TFeature2 extends BuildFeature(
	TFeatureBase,
	{
		customSetting: "Setting F2",
		interval: 1000,
	},
	"I am Feature 2"
) {
	onload(): void {
		console.log("name", this.name);
	}
}
