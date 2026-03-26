import { cacheService } from "@workspace/shared/services/cache.service";
import { CategoryService } from "@workspace/shared/services/categories.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const FPhighLevelCategoriesQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CategoryService(request);
		const resp = await svc.getFPHighLevelCategories();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.categories.highLevelFP(), queryFn);
	return result;
};
