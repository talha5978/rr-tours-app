import { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const collectionsQuery = async ({
	request,
	isFeatured = true,
	cityId = null,
	pageIndex = 0,
	pageSize = 10,
}: {
	request: Request;
	isFeatured: boolean;
	cityId: number | null;
	pageIndex: number;
	pageSize: number;
}) => {
	const queryFn = async () => {
		const svc = new CollectionsService(request);
		const resp = await svc.getFpCollections(isFeatured, cityId, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.collections.listFP(isFeatured, cityId, pageIndex, pageSize),
		queryFn,
	);
	return result;
};

export const collectionDetailsQuery = async ({ request, id }: { request: Request; id: number }) => {
	const queryFn = async () => {
		const svc = new CollectionsService(request);
		const resp = await svc.getCollectionById(id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.collections.details("FP", id), queryFn);
	return result;
};

export const collectionToursQuery = async ({
	request,
	collectionId,
	pageIndex = 0,
	pageSize = 12,
	q = "",
	filters = {},
}: {
	request: Request;
	collectionId: number;
	pageIndex?: number;
	pageSize?: number;
	q?: string;
	filters?: Partial<FPTourFilters>;
}) => {
	const queryFn = async () => {
		const svc = new CollectionsService(request);
		const resp = await svc.getCollectionTours(collectionId, pageIndex, pageSize, q, filters);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.collections.tours(collectionId, pageIndex, pageSize, q, filters),
		queryFn,
	);
	return result;
};
