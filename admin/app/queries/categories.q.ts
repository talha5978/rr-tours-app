import { queryOptions } from "@tanstack/react-query";
import { CategoryService } from "@workspace/shared/services/categories.service";
import type {
	GetCategoryDetailsForUpdateResponse,
	GetCategoryList,
	GetHighLevelCategoriesResponse,
} from "@workspace/shared/types/categories";

type HighLevelCategoryArgs = {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
};

export const highLevelCategoriesQuery = ({ request, q, pageIndex, pageSize }: HighLevelCategoryArgs) => {
	return queryOptions<GetHighLevelCategoriesResponse>({
		queryKey: ["highLvlCategories", q, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new CategoryService(request);
			const result = await svc.getHighLevelCategories(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const categoryDetailsUpdateQuery = (request: Request, categoryId: number) => {
	return queryOptions<GetCategoryDetailsForUpdateResponse>({
		queryKey: ["categoryDetailsForUpdate", categoryId],
		queryFn: async () => {
			const svc = new CategoryService(request);
			const result = await svc.getCategoryDetails(categoryId);
			return result;
		},
	});
};

export const categoryListQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetCategoryList>({
		queryKey: ["categoryList"],
		queryFn: async () => {
			const svc = new CategoryService(request);
			const result = await svc.getCategoryList();
			return result;
		},
	});
};
