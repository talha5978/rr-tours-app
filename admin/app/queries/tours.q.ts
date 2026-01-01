import { queryOptions } from "@tanstack/react-query";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { GetTourDetails } from "@workspace/shared/types/tours";

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
