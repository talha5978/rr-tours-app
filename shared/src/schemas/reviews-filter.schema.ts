import { z } from "zod";

export const filterSchema = z.object({
	min_rating: z.string().optional(),
	verified_only: z.boolean().optional(),
	sort_by: z.enum(["date", "rating"]).optional(),
	sort_order: z.enum(["asc", "desc"]).optional(),
});

export type FilterForm = z.infer<typeof filterSchema>;
