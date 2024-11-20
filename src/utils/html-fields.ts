import { formatKey } from "./html-formatting";
import { Logger } from "./logging";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = new Logger().setContext(__filename);

export const wrapperCls = `classy-field`;
export const keySpanCls = `classy-key`;
export const valueSpanCls = `classy-value`;

function sanitizeString(str: string) {
	return str
		.replace(/&/g, "&amp;") // Ampersand
		.replace(/</g, "&lt;") // Less than
		.replace(/>/g, "&gt;") // Greater than
		.replace(/"/g, "&quot;") // Double quotes
		.replace(/'/g, "&#39;"); // Single quote
}

export async function addInlineFields(el: HTMLElement) {
	for (const item of el.findAllSelf("p,h1,h2,h3,h4,h5,h6,li,span,th,td")) {
		const childNodes = Array.from(item.childNodes);
		for (const node of childNodes) {
			if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
				await decorateFields(node);
			}
		}
	}
	// Dataview version:
	// for (let p of el.findAllSelf("p,h1,h2,h3,h4,h5,h6,li,span,th,td")) {
	// 	const init: DataviewInit = {
	// 		app: this.app,
	// 		// index: this.index,
	// 		settings: this.settings,
	// 		container: p,
	// 	};
	// await replaceInlineFields(ctx, init);
	// }
}

export async function decorateFields(node: ChildNode) {
	const regex = /\[([^\]]+):: ([^\]]+)\]/g;
	const fullText = node.nodeValue;
	if (!fullText) return;
	// log.debug({}, "fullText: ", fullText);
	let match;
	let lastIndex = 0;
	const docFragment = document.createDocumentFragment();

	while ((match = regex.exec(fullText)) !== null) {
		// log.debug({}, "match: ", match);
		const key = match[1];
		const value = match[2];
		const beforeMatch = fullText.slice(lastIndex, match.index);
		lastIndex = regex.lastIndex;

		// Append text before match
		if (beforeMatch) {
			docFragment.appendChild(document.createTextNode(beforeMatch));
		}

		const keyCls = `${keySpanCls}-${sanitizeString(key)}`;
		const valueCls = `${valueSpanCls}-${sanitizeString(value)}`;
		// Wrapper
		const wrapperDiv = document.createElement("div");
		wrapperDiv.className = `${wrapperCls} ${keyCls} ${valueCls}`;
		wrapperDiv.style.display = "inline-block";
		// Key
		const keySpan = document.createElement("span");
		keySpan.className = keySpanCls;
		keySpan.textContent = key + " ";
		// Value
		const valueSpan = document.createElement("span");
		valueSpan.className = valueSpanCls;
		valueSpan.textContent = formatKey(key, value) || value;
		// Append to wrapper
		wrapperDiv.appendChild(keySpan);
		wrapperDiv.appendChild(valueSpan);
		docFragment.appendChild(wrapperDiv);
	}

	// Append any remaining text after the last match
	const afterLastMatch = fullText.slice(lastIndex);
	if (afterLastMatch) {
		docFragment.appendChild(document.createTextNode(afterLastMatch));
	}

	// Replace the original node with the document fragment
	if (node.parentNode) {
		// log.debug({}, "Replacing node with docFragment: ", docFragment);
		node.parentNode.replaceChild(docFragment, node);
		// log.debug({}, "Node replaced with docFragment: ", node);
	}
}
