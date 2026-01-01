import { queryOptions } from "@tanstack/react-query";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import type { GetAllTourTags } from "@workspace/shared/types/tour-tags";

export const allTagsQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllTourTags>({
		queryKey: ["tour_tags"],
		queryFn: async () => {
			const svc = new TourTagsService(request);
			const result = await svc.getAllTags();
			return result;
		},
	});
};
