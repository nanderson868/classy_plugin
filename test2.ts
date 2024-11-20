/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */

import { Page } from "@/api/dataview";

// import { current } from "./src/constants";
// const {getCurrentLocation, getCurrentLocation2} = require("./src/utils/location");

// console.log("Current location: ", getCurrentLocation());
// console.log("Current location 2: ", getCurrentLocation2());

/* eslint-disable no-useless-escape */
// (async () => {
// 	const url = "https://mail.superhuman.com/inbox/thread/12345#app";
// 	const pattern =
// 		/^https:\/\/mail\.superhuman\.com\/([^\/]+)\/(?:.*?\/)?thread\/(.*?)(?:#app)?$/;
// 	const replacement = "superhuman://$1/thread/$2";
// 	console.log("URL: ", url);
// 	if (pattern.test(url)) {
// 		return url.replace(pattern, replacement);
// 	}

// 	return "No match found";
// })().then((result) => {
// 	console.log("Output: ", result);
// 	return result;
// });
// await(async () => {
// 	const retVal = async () => {
// 		const url = "https://mail.superhuman.com/inbox/thread/12345#app";
// 		const pattern =
// 			/^https:\/\/mail\.superhuman\.com\/([^\/]+)\/(?:.*?\/)?thread\/(.*?)(?:#app)?$/;
// 		const replacement = "superhuman://$1/thread/$2";
// 		console.log("URL: ", url);
// 		if (pattern.test(url)) {
// 			return url.replace(pattern, replacement);
// 		}

// 		return "No match found";
// 	};
// 	console.log(
// 		"Output: ",
// 		retVal().then((result) => result)
// 	);
// 	return await retVal();
// })();

// async () => {
// 	const retVal = 10;
// 	return retVal;
// };

// async function foobar() {
// 	const test = async () => {
// 		return "Hello World";
// 	};

// 	const test2 = Promise.resolve(test());
// 	console.log("In Async: ", test2);
// 	return test2;
// }

// `${(async () => {
// 	const retVal = 10;
// 	return retVal;
// })().then((result) => {
// 	console.log(result);
// })}`;

// const output = await(async () => {
// 	try {
// 		const retVal = async () => {
// 			return "Hello World";
// 		};
// 		return await retVal();
// 	} catch (error) {
// 		console.error(error);
// 	}
// });

// (() => {
// 	try {
// 		const url = current.Link;
// 		const pattern =
// 			/^https:\/\/mail\.superhuman\.com\/([^\/]+)\/(?:.*?\/)?thread\/(.*?)(?:#app)?$/;
// 		const replacement = "superhuman://$1/thread/$2";
// 		if (pattern.test(url)) {
// 			return url.replace(pattern, replacement);
// 		}
// 	} catch (error) {
// 		console.error(`Formula error in ${current.file.path}: ${error}`);
// 	}
// })();

// export function getCurrentLocation2() {
// 	return Promise.race([
// 		new Promise((resolve) => {
// 			fetch("http://ip-api.com/json/")
// 				.then((response) => response.json())
// 				.then((data) =>
// 					resolve(
// 						[data.city, data.regionName, data.country]
// 							.filter((x) => !!x)
// 							.join(", ")
// 					)
// 				);
// 		}),
// 		new Promise((resolve) =>
// 			// If we haven't fetched the location within 300ms,
// 			// time-out and resolve with the placeholder text instead
// 			setTimeout(() => resolve("Location"), 300)
// 		),
// 	]);
// }

// getCurrentLocation2().then((result) => {
// 	console.log("Current location 2: ", result);
// 	return result;
// });

// (async () => {
// 	return Promise.race([
// 		new Promise((resolve) => {
// 			fetch("http://ip-api.com/json/")
// 				.then((response) => response.json())
// 				.then((data) =>
// 					resolve(
// 						[data.city, data.regionName, data.country]
// 							.filter((x) => !!x)
// 							.join(", ")
// 					)
// 				);
// 		}),
// 		new Promise((resolve) =>
// 			// If we haven't fetched the location within 300ms,
// 			// time-out and resolve with the placeholder text instead
// 			setTimeout(() => resolve("Location"), 300)
// 		),
// 	]);
// })();

function getCurrentLocation(): Promise<string> {
	return new Promise((resolve, reject) => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// Convert position.coords to a string format
					const coordsString = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
					resolve(coordsString);
				},
				(error) => {
					reject(error);
				}
			);
		} else {
			reject(new Error("Geolocation is not supported by this browser."));
		}
	});
}

getCurrentLocation().then((result) => {
	console.log("Current location: ", result);
	return result;
});
