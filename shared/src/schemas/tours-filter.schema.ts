import { z } from "zod";
import { tourSortByEnums, sortTypeEnums } from "@workspace/shared/constants/constants";

export const TourFilterFormSchema = z.object({
	q: z.string().optional(),
	page: z.string().optional(),
	size: z.string().optional(),
	isFeatured: z.enum(["true", "false", "null"]).optional(),
	isActive: z.enum(["true", "false", "null"]).optional(),
	categories: z.array(z.string()).optional(),
	cities: z.array(z.string()).optional(),
	providers: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	isOpenDated: z.enum(["true", "false", "null"]).optional(),
	created_at: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.nullable()
		.optional(),
	sortBy: z.enum(tourSortByEnums).optional(),
	sortType: z.enum(sortTypeEnums).optional(),
});

export type TourFilterFormData = z.infer<typeof TourFilterFormSchema>;

export interface TourFilters {
	isFeatured?: boolean;
	isActive?: boolean;
	categories?: string[];
	cities?: string[];
	providers?: string[];
	tags?: string[];
	isOpenDated?: boolean;
	created_at?: { from: Date; to: Date } | null;
	sortBy?: TourFilterFormData["sortBy"];
	sortType?: TourFilterFormData["sortType"];
}
