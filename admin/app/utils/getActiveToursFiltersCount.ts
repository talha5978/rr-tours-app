export const getActiveToursFiltersCount = (params: URLSearchParams): number => {
	const keys = ["q", "page", "size", "sortBy", "sortType"];
	const nonFilterKeys = new Set(keys);

	let count = 0;

	for (const [key, value] of params.entries()) {
		if (nonFilterKeys.has(key)) continue;
		if (value === "null" || value === "") continue;

		if (key === "categories" || key === "cities" || key === "providers" || key === "tags") {
			const items = value.split(",").filter(Boolean);
			if (items.length > 0) count++;
		} else if (key === "createdFrom" || key === "createdTo") {
			// Only count once for date range
			if (params.has("createdFrom") && params.has("createdTo")) {
				count++;
				break; // no need to double count
			}
		} else {
			count++;
		}
	}

	return count;
};
