import { queryOptions } from "@tanstack/react-query";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import type { CollectionDetailsResp, HighLevelCollectionsResp } from "@workspace/shared/types/collections";

interface HighLevelCategoryArgs {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
}

export const highLevelCollectionsQuery = ({ request, q, pageIndex, pageSize }: HighLevelCategoryArgs) => {
	return queryOptions<HighLevelCollectionsResp>({
		queryKey: ["highLvlCollections", q, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new CollectionsService(request);
			const result = await svc.getHighLevelCollections(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const collectionDetailsQuery = ({ request, id }: { request: Request; id: number }) => {
	return queryOptions<CollectionDetailsResp>({
		queryKey: ["collection", id],
		queryFn: async () => {
			const svc = new CollectionsService(request);
			const result = await svc.getCollectionDetails(id);
			return result;
		},
	});
};
