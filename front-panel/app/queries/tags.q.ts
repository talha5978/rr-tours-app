import { queryOptions } from "@tanstack/react-query";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import type { GetAllTourTags } from "@workspace/shared/types/tour-tags";

export const allTagsQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllTourTags>({
		queryKey: ["fp_tour_tags"],
		queryFn: async () => {
			const svc = new TourTagsService(request);
			const result = await svc.getAllTagsForFrontPanel();
			return result;
		},
	});
};

export const cityTagsQuery = ({ request, cityId }: { request: Request; cityId: number }) => {
	return queryOptions<GetAllTourTags>({
		queryKey: ["fp_city_tags", `${cityId}`],
		queryFn: async () => {
			const svc = new TourTagsService(request);
			const result = await svc.getAllTagsForCity(cityId);
			return result;
		},
	});
};
