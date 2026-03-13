import { z } from "zod";

export const addCollectionSchema = z.object({
	name: z
		.string()
		.min(1, "Collection name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Collection name is required.",
		}),
	description: z.string().optional(),
	isFeatured: z.enum(["Y", "N"]),
	tours: z.array(z.string()).refine((value) => value.length > 0, "At least one tour is required."),
	cities: z.array(z.number()),
});

export type AddCollectionSchemaType = z.infer<typeof addCollectionSchema>;

export const updateCollectionSchema = z.object({
	name: z
		.string()
		.min(1, "Collection name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Collection name is required.",
		}),
	description: z.string().optional(),
	isFeatured: z.enum(["Y", "N"]),
	tours: z.array(z.string()).refine((value) => value.length > 0, "At least one tour is required."),
	cities: z.array(z.number()),
});

export type UpdateCollectionSchema = z.infer<typeof updateCollectionSchema>;