import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		return {
			success: false,
			error: "Collection id is required",
		};
	}

	try {
		const svc = new CollectionsService(request);
		const { error } = await svc.deleteCollection(Number(id));

		await cacheService.invalidatePattern(CACHE_KEYS.collections.highLevelAD() + `:*`);
		await cacheService.invalidate(CACHE_KEYS.collections.details("AD", id));
		await cacheService.invalidate(CACHE_KEYS.collections.details("FP", id));
		await cacheService.invalidatePattern(CACHE_KEYS.collections.listFP() + `:*`);
		await cacheService.invalidatePattern(CACHE_KEYS.collections.tours() + `:*`);

		return { success: true, error };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to delete collection",
		};
	}
};
