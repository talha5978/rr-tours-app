import { z } from "zod";
import { sortTypeEnums, fpTourSortByEnums } from "@workspace/shared/constants/constants";

export const FPTourFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	isFeatured: z.boolean().optional(),
	categories: z.array(z.string()).optional(),
	cities: z.array(z.string()).optional(),
	providers: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	price: z.array(z.number(), z.number()).optional(),
	sortBy: z.enum(fpTourSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type FPTourFilterFormData = z.infer<typeof FPTourFilterFormSchema>;

export interface FPTourFilters {
	isFeatured?: boolean;
	categories?: string[];
	cities?: string[];
	providers?: string[];
	tags?: string[];
	price?: number[];
	sortBy?: FPTourFilterFormData["sortBy"];
	sortType?: FPTourFilterFormData["sortType"];
}
