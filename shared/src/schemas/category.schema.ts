import { z } from "zod";
import {
	MetaDetailsActionDataSchema,
	MetaDetailsInputSchema,
} from "@workspace/shared/schemas/meta-details.schema";
import {
	ALLOWED_IMAGE_FORMATS,
	getSimpleImgFormats,
	MAX_IMAGE_SIZE,
} from "@workspace/shared/constants/constants";

export const AddCategorySchema = z.object({
	name: z
		.string({ required_error: "Category name is required." })
		.min(1, "Category name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Category name is required.",
		}),

	image: z
		.instanceof(File, { message: "Image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed.",
		),

	sort_order: z.string().optional().default("1"),

	meta_details: MetaDetailsInputSchema,
});

export type AddCategoryInput = z.input<typeof AddCategorySchema>;

export const AddCategoryActionSchema = z.object({
	name: z.string(),
	image: z.instanceof(File),
	sort_order: z.string().optional().default("1"),
	meta_details: MetaDetailsActionDataSchema,
});

export type AddCategoryActionData = z.infer<typeof AddCategoryActionSchema>;

export const UpdateCategorySchema = z.object({
	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	image: z.union([
		z
			.instanceof(File, { message: "Image is required." })
			.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
			.refine(
				(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
				`Only ${getSimpleImgFormats()} image formats are allowed.`,
			),
		z.string().min(1, "Image path is required."),
	]),

	sort_order: z.string().optional().default("1"),
	meta_details: MetaDetailsInputSchema,
});

export type UpdateCategoryInput = z.input<typeof UpdateCategorySchema>;

export const UpdateCategoryActionSchema = z.object({
	image: z.instanceof(File).optional(),
	removed_image: z.string().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
	name: z.string().optional(),
	sort_order: z.string().optional(),
});

export type UpdateCategoryActionData = z.infer<typeof UpdateCategoryActionSchema>;
