import { queryOptions } from "@tanstack/react-query";
import { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import type { CollectionRow, GetFpCollectionsResponse } from "@workspace/shared/types/collections";

export const collectionsQuery = ({
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
	return queryOptions<GetFpCollectionsResponse>({
		queryKey: ["collections", isFeatured, cityId, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new CollectionsService(request);
			const result = await svc.getFpCollections(isFeatured, cityId, pageIndex, pageSize);
			return result;
		},
	});
};

export const collectionDetailsQuery = ({ request, id }: { request: Request; id: number }) => {
	return queryOptions<CollectionRow | null>({
		queryKey: ["collection", String(id)],
		queryFn: async () => {
			const svc = new CollectionsService(request);
			const result = await svc.getCollectionById(id);
			return result;
		},
	});
};

export const collectionToursQuery = ({
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
	return queryOptions({
		queryKey: ["collection-tours", String(collectionId), pageIndex, pageSize, q, filters],
		queryFn: async () => {
			const svc = new CollectionsService(request);
			const result = await svc.getCollectionTours(collectionId, pageIndex, pageSize, q, filters);
			return result;
		},
	});
};
