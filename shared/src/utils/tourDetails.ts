import { addDays, format, isBefore, parseISO, startOfToday } from "date-fns";
import type { TourDetailOption } from "@workspace/shared/types/tours";
import type { Tables } from "@workspace/shared/types/supabase";

type AvailabilitySlot = Tables<"time_slots"> & { capacity: number };

/**
 * Returns the effective time slots for a specific date and tour option,
 * after applying any availability overrides for that date.
 *
 * @param date - The date to check (Date object or ISO string)
 * @param option - The selected TourDetailOption with rules & overrides
 * @returns Array of effective time slots with updated capacity
 */
export function getTimeSlotsForDate(date: Date | string, option: TourDetailOption): AvailabilitySlot[] {
	// Normalize date to YYYY-MM-DD string
	const targetDateStr = typeof date === "string" ? date.split("T")[0] : format(date, "yyyy-MM-dd");

	const targetDate = parseISO(targetDateStr);
	const targetWeekday = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

	// 1. Find all rules that cover this date
	const applicableRules = option.availability_rules.filter((rule) => {
		const start = parseISO(rule.start_date);
		const end = parseISO(rule.end_date);
		const isInDateRange = !isBefore(targetDate, start) && !isBefore(end, targetDate);
		const isCorrectWeekday = rule.weekdays.includes(targetWeekday);
		return isInDateRange && isCorrectWeekday && rule.is_active;
	});

	// 2. Collect all time slots from applicable rules
	let slots: AvailabilitySlot[] = [];
	applicableRules.forEach((rule) => {
		rule.time_slots.forEach((ts) => {
			if (ts.is_active) {
				slots.push({
					...ts,
					capacity: Number(ts.capacity), // ensure number
				});
			}
		});
	});

	// 3. Apply overrides for this exact date
	const dateOverrides = (option.availability_overrides ?? []).filter((ov) => ov.date === targetDateStr);

	dateOverrides.forEach((override) => {
		if (override.override_type === "CLOSE") {
			// Close whole day or specific slot
			if (override.time_slot_id === null) {
				// Whole day closed → no slots available
				slots = [];
			} else {
				// Specific slot closed → remove it
				slots = slots.filter((s) => s.id !== override.time_slot_id);
			}
		} else if (override.override_type === "CAPACITY_CHANGE") {
			const newCap = override.new_capacity !== null ? Number(override.new_capacity) : null;

			if (override.time_slot_id === null) {
				// Whole day capacity change → apply to all slots
				slots = slots.map((s) => ({
					...s,
					capacity: newCap ?? s.capacity, // null = unlimited?
				}));
			} else {
				// Specific slot capacity change
				slots = slots.map((s) =>
					s.id === override.time_slot_id ? { ...s, capacity: newCap ?? s.capacity } : s,
				);
			}
		}
	});

	// 4. Sort by original sort order (optional but nice UX)
	slots.sort((a, b) => {
		// If you have sort_order in time_slots, use it
		// Otherwise sort by label or time (fallback)
		return (a.label ?? "").localeCompare(b.label ?? "");
	});

	return slots;
}

/**
 * Returns up to maxDates upcoming dates that have at least one available time slot.
 * @param option - The tour option
 * @param maxDates - Max number of dates to return (default 6)
 * @returns Array of { date: Date, formatted: string }
 */
export function getUpcomingAvailableDates(
	option: TourDetailOption,
	maxDates: number = 6,
): { date: Date; formatted: string }[] {
	const today = startOfToday();
	const upcoming: { date: Date; formatted: string }[] = [];

	// We'll check up to 90 days ahead (adjust as needed)
	let current = today;
	let checkedDays = 0;
	const MAX_DAYS_TO_CHECK = 90;

	while (upcoming.length < maxDates && checkedDays < MAX_DAYS_TO_CHECK) {
		current = addDays(current, 1); // start from tomorrow
		checkedDays++;

		// Skip if not covered by any rule (unless open-dated)
		if (!option.isOpenDated && !isDateCoveredByAnyRule(current, option)) {
			continue;
		}

		const slots = getTimeSlotsForDate(current, option);
		if (slots.length > 0 && slots.some((s) => s.capacity > 0)) {
			upcoming.push({
				date: current,
				formatted: format(current, "MMM d ccc"), // e.g. "Jan 25"
			});
		}
	}

	return upcoming;
}

export function isDateCoveredByAnyRule(date: Date, option: TourDetailOption | null): boolean {
	if (!option || !option.availability_rules?.length) return false;

	const dateStr = format(date, "yyyy-MM-dd");
	const targetDate = parseISO(dateStr);
	const weekday = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

	return option.availability_rules.some((rule) => {
		// Skip inactive rules
		if (!rule.is_active) return false;

		const start = parseISO(rule.start_date);
		const end = parseISO(rule.end_date);

		const inRange = !isBefore(targetDate, start) && !isBefore(end, targetDate);
		const onWeekday = rule.weekdays.includes(weekday);

		return inRange && onWeekday;
	});
}
