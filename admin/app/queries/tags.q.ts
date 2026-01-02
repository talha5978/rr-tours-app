import { queryOptions } from "@tanstack/react-query";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import type { GetAllTourTags, GetTag } from "@workspace/shared/types/tour-tags";

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

export const tagQuery = ({ request, id }: { request: Request; id: number }) => {
	return queryOptions<GetTag>({
		queryKey: ["tour_tag", id],
		queryFn: async () => {
			const svc = new TourTagsService(request);
			const result = await svc.getTagById(id);
			return result;
		},
	});
};
