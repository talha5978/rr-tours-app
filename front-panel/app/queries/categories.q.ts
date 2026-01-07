import { queryOptions } from "@tanstack/react-query";
import { CategoryService } from "@workspace/shared/services/categories.service";
import type { GetFPHighLevelCategories } from "@workspace/shared/types/categories";

export const FPhighLevelCategoriesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetFPHighLevelCategories>({
		queryKey: ["FP_highLvlCategories"],
		queryFn: async () => {
			const svc = new CategoryService(request);
			const result = await svc.getFPHighLevelCategories();
			return result;
		},
	});
};
