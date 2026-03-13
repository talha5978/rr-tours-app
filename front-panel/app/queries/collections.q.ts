import { queryOptions } from "@tanstack/react-query";
import { CollectionsService } from "@workspace/shared/services/collections.service";
import type { GetFpCollectionsResponse } from "@workspace/shared/types/collections";

export const collectionsQuery = ({
	request,
	isFeatured = true,
	cityId = null,
	pageIndex = 0,
	pageSize = 10,
} : {
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
