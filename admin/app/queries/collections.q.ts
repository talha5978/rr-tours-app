import { cacheService } from "@workspace/shared/services/cache.service";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

interface HighLevelCategoryArgs {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
}

export const highLevelCollectionsQuery = async ({
	request,
	q,
	pageIndex,
	pageSize,
}: HighLevelCategoryArgs) => {
	const queryFn = async () => {
		const svc = new CollectionsService(request);
		const resp = await svc.getHighLevelCollections(q, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.collections.highLevelAD(q, pageIndex, pageSize),
		queryFn,
	);
	return result;
};

export const collectionDetailsQuery = async ({ request, id }: { request: Request; id: number }) => {
	const queryFn = async () => {
		const svc = new CollectionsService(request);
		const resp = await svc.getCollectionDetails(id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.collections.details("AD", id), queryFn);
	return result;
};
