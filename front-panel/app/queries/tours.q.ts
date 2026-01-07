import { queryOptions } from "@tanstack/react-query";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import type { GetTourDetails } from "@workspace/shared/types/tours";
import type { GetFPHighLevelToursResponse } from "@workspace/shared/types/fp-tours";

export const tourDetailsQuery = ({ request, tour_id }: { request: Request; tour_id: string }) => {
	return queryOptions<GetTourDetails | null>({
		queryKey: ["fp_tour_details", tour_id],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getFPTourDetails(tour_id);
			return result;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
	});
};

export const toursQuery = ({
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
	return queryOptions<GetFPHighLevelToursResponse>({
		queryKey: ["fp_tours", q, pageIndex, pageSize, filters],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getFPHighLevelTours(q, pageIndex, pageSize, filters);
			return result;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
	});
};
