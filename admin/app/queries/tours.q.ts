import { queryOptions } from "@tanstack/react-query";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { GetHighLevelToursResponse, GetTourDetails } from "@workspace/shared/types/tours";

export const tourDetailsQuery = ({ request, tour_id }: { request: Request; tour_id: string }) => {
	return queryOptions<GetTourDetails | null>({
		queryKey: ["tour_details", tour_id],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getTourDetails(tour_id);
			return result;
		},
	});
};

export const highLevelToursQuery = ({
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
	return queryOptions<GetHighLevelToursResponse>({
		queryKey: ["high_level_tours", q, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new ToursService(request);
			const result = await svc.getHighLevelTours(q, pageIndex, pageSize);
			return result;
		},
	});
};
