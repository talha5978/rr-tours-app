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

export const updateCollectionActionSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	isFeatured: z.boolean().optional(),
	added_tours: z.array(z.string()).optional(),
	removed_tours: z.array(z.string()).optional(),
	added_cities: z.array(z.number()).optional(),
	removed_cities: z.array(z.number()).optional(),
});

export type UpdateCollectionActionSchema = z.infer<typeof updateCollectionActionSchema>;
