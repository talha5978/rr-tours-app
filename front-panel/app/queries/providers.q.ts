import { cacheService } from "@workspace/shared/services/cache.service";
import { TourProvidersService } from "@workspace/shared/services/providers.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const allProvidersQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new TourProvidersService(request);
		const resp = await svc.getAllTourProviders();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.tourProviders.list("FP"), queryFn, 86400);
	return result;
};
