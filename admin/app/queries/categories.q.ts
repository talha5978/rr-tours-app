import { cacheService } from "@workspace/shared/services/cache.service";
import { CategoryService } from "@workspace/shared/services/categories.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

type HighLevelCategoryArgs = {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
};

export const highLevelCategoriesQuery = async ({
	request,
	q,
	pageIndex,
	pageSize,
}: HighLevelCategoryArgs) => {
	const queryFn = async () => {
		const svc = new CategoryService(request);
		const resp = await svc.getHighLevelCategories(q, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.categories.highLevelAD(q, pageIndex, pageSize),
		queryFn,
		43200,
	);
	return result;
};

export const categoryDetailsUpdateQuery = async (request: Request, categoryId: number) => {
	const queryFn = async () => {
		const svc = new CategoryService(request);
		const resp = await svc.getCategoryDetails(categoryId);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.categories.details(categoryId), queryFn);
	return result;
};

export const categoryListQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CategoryService(request);
		const resp = await svc.getCategoryList();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.categories.list(), queryFn, 43200);
	return result;
};
