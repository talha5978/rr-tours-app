import { ToursService } from "@workspace/shared/services/tours.service";
import type { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export const tourDetailsQuery = async ({ request, tour_id }: { request: Request; tour_id: string }) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getFPTourDetails(tour_id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tours.details("FP", tour_id), queryFn);
	return result;
};

export const toursQuery = async ({
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
	filters?: FPTourFilters;
}) => {
	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getFPHighLevelTours(q, pageIndex, pageSize, filters);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.tours.highLevel("FP", q, pageIndex, pageSize, filters),
		queryFn,
	);
	return result;
};

export const availabilityQuery = async (
	request: Request,
	optionId: number | null,
	dateStr: string | null,
	tourId: string | null,
) => {
	if (!optionId || !dateStr || !tourId) return [];

	const queryFn = async () => {
		const svc = new ToursService(request);
		const resp = await svc.getTourTimeSlotAvailability(optionId, dateStr);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.tours.slotAvailability(optionId, dateStr, tourId),
		queryFn,
	);
	return result;
};
