import { Duration, type DateTime } from "luxon";
import type { QuerySettings } from "@/settings";

/** Render a DateTime in a minimal format to save space. */
export function renderMinimalDate(
	time: DateTime,
	settings: QuerySettings,
	locale: string
): string {
	// If there is no relevant time specified, fall back to just rendering the date.
	if (time.second == 0 && time.minute == 0 && time.hour == 0) {
		return time.toLocal().toFormat(settings.defaultDateFormat, { locale });
	}

	return time.toLocal().toFormat(settings.defaultDateTimeFormat, { locale });
}

/** Normalize a duration to all of the proper units. */
export function normalizeDuration(dur: Duration) {
	if (dur === undefined || dur === null) return dur;

	return dur.shiftToAll().normalize();
}

/** Render a duration in a minimal format to save space. */
export function renderMinimalDuration(dur: Duration): string {
	dur = normalizeDuration(dur);

	// toHuman outputs zero quantities e.g. "0 seconds"
	dur = Duration.fromObject(
		Object.fromEntries(
			Object.entries(dur.toObject()).filter(
				([, quantity]) => quantity != 0
			)
		)
	);

	return dur.toHuman();
}
