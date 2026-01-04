import type { TourFilters } from "@workspace/shared/schemas/tours-filter.schema";
import { defaultTourSortByFilter, defaultTourSortTypeFilter } from "@workspace/shared/constants/constants";

interface FilterPayloadParams {
	request: Request;
}
/**
 * @param request : request getting in the loader to generate url to get the search params
 * @description : Returns the filter payload for service function and to be used to in the loader
 */
export function getToursFiltersPayload({ request }: FilterPayloadParams) {
	const url = new URL(request.url);

	const isFeaturedQ = url.searchParams.get("isFeatured");
	const isActiveQ = url.searchParams.get("isActive");
	const categoriesQ = url.searchParams.get("categories");
	const citiesQ = url.searchParams.get("cities");
	const providersQ = url.searchParams.get("providers");
	const tagsQ = url.searchParams.get("tags");
	const isOpenDatedQ = url.searchParams.get("isOpenDated");

	const fromParam = url.searchParams.get("createdFrom");
	const toParam = url.searchParams.get("createdTo");

	const sortBy = (url.searchParams.get("sortBy") as TourFilters["sortBy"]) || defaultTourSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as TourFilters["sortType"]) || defaultTourSortTypeFilter;

	const filters: TourFilters = {
		// boolean flags
		...(isFeaturedQ != null && { isFeatured: isFeaturedQ === "true" }),
		...(isActiveQ != null && { isActive: isActiveQ === "true" }),
		...(isOpenDatedQ != null && { isOpenDated: isOpenDatedQ === "true" }),

		// multi-select arrays
		...(categoriesQ != null && { categories: categoriesQ.split(",") }),
		...(citiesQ != null && { cities: citiesQ.split(",") }),
		...(providersQ != null && { providers: providersQ.split(",") }),
		...(tagsQ != null && { tags: tagsQ.split(",") }),

		// date range
		...(fromParam &&
			toParam && {
				created_at: {
					from: new Date(fromParam),
					to: new Date(toParam),
				},
			}),

		// sort fields
		...(sortBy && { sortBy: sortBy }),
		...(sortType && { sortType: sortType }),
	};

	// console.log("Filters: ", filters);

	return filters;
}
