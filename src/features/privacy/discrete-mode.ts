// import { FeatureBase } from "@/router/feature-base";
import { ABase } from "@/router/mixin-constrained";

// export const DISCRETE_MODE_SETTINGS = {
// 	enabled: false,
// 	safeMode: true,
// };

export class DiscreteMode extends ABase {
	// static readonly NAME = "Discrete Mode";
	readonly _alias = "Discrete Mode";
	_settings = {
		safeMode: true,
	};

	async onload() {
		this.plugin.registerDomEvent(document, "keydown", (event) => {
			if (event.key === "#") {
				const modalEl = document.querySelector(".suggestion-container");
				if (!modalEl) return;
				const suggestionItems =
					document.querySelectorAll(".suggestion-item");
				this.logger.info("suggestionItems", suggestionItems);
				suggestionItems.forEach((item) => {
					if (item.textContent?.startsWith("-")) {
						item.remove();
					}
				});
			}
		});
	}
}
