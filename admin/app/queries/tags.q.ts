import { cacheService } from "@workspace/shared/services/cache.service";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const allTagsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new TourTagsService(request);
		const result = await svc.getAllTags();
		return result;
	};

	const result = await cacheService.get(CACHE_KEYS.tags.tags("AD"), queryFn);
	return result;
};

export const tagQuery = async ({ request, id }: { request: Request; id: number }) => {
	const queryFn = async () => {
		const svc = new TourTagsService(request);
		const result = await svc.getTagById(id);
		return result;
	};

	const result = await cacheService.get(CACHE_KEYS.tags.tag(id), queryFn);
	return result;
};
