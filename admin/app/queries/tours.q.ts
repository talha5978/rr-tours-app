import { ToursService } from "@workspace/shared/services/tours.service";
import type { TourFilters } from "@workspace/shared/schemas/tours-filter.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const tourDetailsQuery = async ({ request, tour_id }: { request: Request; tour_id: string }) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getTourDetails(tour_id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tours.details("AD", tour_id), queryFn);
	return result;
};

export const tourDetailsForUpdateQuery = async ({
	request,
	tour_id,
}: {
	request: Request;
	tour_id: string;
}) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getTourDetailsForUpdate(tour_id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tours.detailForUpdate(tour_id), queryFn);
	return result;
};

export const highLevelToursQuery = async ({
	request,
	q,
	pageIndex,
	pageSize,
	filters,
}: {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
	filters?: TourFilters;
}) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getHighLevelTours(q, pageIndex, pageSize, filters);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.tours.highLevel("AD", q, pageIndex, pageSize, filters),
		queryFn,
	);

	return result;
};

export const toursListQuery = async ({
	request,
	q,
	pageIndex,
	pageSize,
}: {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
}) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getToursList(q, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tours.list("AD", q, pageIndex, pageSize), queryFn);
	return result;
};

export const tourOptionsListQuery = async ({
	request,
	q,
	pageIndex,
	pageSize,
}: {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
}) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getTourOptionsList(q, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.tours.optionsList("AD", q, pageIndex, pageSize),
		queryFn,
	);
	return result;
};
