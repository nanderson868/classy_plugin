/** Test-environment-friendly function which fetches the current system locale. */
export function currentLocale(): string {
	if (typeof window === "undefined") return "en-US";
	return window.navigator.language;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function getCurrentLocation(): Promise<string> {
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

export function getCurrentLocationFromIP(): Promise<string> {
	return Promise.race([
		new Promise<string>((resolve) => {
			// Explicitly define the Promise type here
			fetch("http://ip-api.com/json/")
				.then((response) => response.json())
				.then((data) =>
					resolve(
						[data.city, data.regionName, data.country]
							.filter((x) => !!x)
							.join(", ")
					)
				);
		}),
		new Promise<string>(
			(
				resolve // Also define the Promise type here
			) =>
				// If we haven't fetched the location within 300ms,
				// time-out and resolve with the placeholder text instead
				setTimeout(() => resolve("Location"), 300)
		),
	]);
}
