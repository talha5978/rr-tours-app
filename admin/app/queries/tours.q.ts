import { queryOptions } from "@tanstack/react-query";
import { ToursService } from "@workspace/shared/services/tours.service";
import type {
	GetHighLevelToursResponse,
	GetTourDetails,
	GetTourDetailsForUpdate,
} from "@workspace/shared/types/tours";
import type { TourFilters } from "@workspace/shared/schemas/tours-filter.schema";

export const tourDetailsQuery = ({ request, tour_id }: { request: Request; tour_id: string }) => {
	return queryOptions<GetTourDetails | null>({
		queryKey: ["tour_details", tour_id],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getTourDetails(tour_id);
			return result;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
	});
};

export const tourDetailsForUpdateQuery = ({ request, tour_id }: { request: Request; tour_id: string }) => {
	return queryOptions<GetTourDetailsForUpdate | null>({
		queryKey: ["tour_details_update", tour_id],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getTourDetailsForUpdate(tour_id);
			return result;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
	});
};

export const highLevelToursQuery = ({
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
	return queryOptions<GetHighLevelToursResponse>({
		queryKey: ["high_level_tours", q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getHighLevelTours(q, pageIndex, pageSize, filters);
			return result;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
	});
};
