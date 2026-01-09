import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTourDurationHours(input: number): string {
	const hours = Math.floor(input);
	const fractionalPart = input - hours;

	// If no decimal part, return hours only
	if (fractionalPart === 0) {
		return `${hours} hour${hours !== 1 ? "s" : ""}`;
	}

	const minutes = Math.round(fractionalPart * 60);

	return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
