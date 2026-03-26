import { cacheService } from "@workspace/shared/services/cache.service";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const allTagsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new TourTagsService(request);
		const resp = await svc.getAllTagsForFrontPanel();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tags.tags("FP"), queryFn);
	return result;
};

export const cityTagsQuery = async ({ request, cityId }: { request: Request; cityId: number }) => {
	const queryFn = async () => {
		const svc = new TourTagsService(request);
		const resp = await svc.getAllTagsForCity(cityId);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tags.cityTags(cityId), queryFn);
	return result;
};
