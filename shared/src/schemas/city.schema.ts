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

export const AddCitySchema = z.object({
	name: z
		.string({ required_error: "City name is required." })
		.min(1, "City name is required.")
		.max(100, "City name must be at most 100 characters.")
		.refine((value) => value.trim().length > 0, {
			message: "City name is required.",
		}),

	card_image: z
		.instanceof(File, { message: "Card image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Card image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed.",
		),

	full_image: z
		.instanceof(File, { message: "Full image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Full image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed.",
		),

	meta_details: MetaDetailsInputSchema,
});

export type AddCityInput = z.input<typeof AddCitySchema>;

export const AddCityActionSchema = z.object({
	name: z.string(),
	card_image: z.instanceof(File),
	full_image: z.instanceof(File),
	meta_details: MetaDetailsActionDataSchema,
});

export type AddCityActionData = z.infer<typeof AddCityActionSchema>;

export const UpdateCitySchema = z.object({
	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	card_image: z.union([
		z
			.instanceof(File, { message: "Image is required." })
			.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
			.refine(
				(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
				`Only ${getSimpleImgFormats()} image formats are allowed.`,
			),
		z.string().min(1, "Image path is required."),
	]),

	full_image: z.union([
		z
			.instanceof(File, { message: "Image is required." })
			.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
			.refine(
				(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
				`Only ${getSimpleImgFormats()} image formats are allowed.`,
			),
		z.string().min(1, "Image path is required."),
	]),

	meta_details: MetaDetailsInputSchema,
});

export type UpdateCityInput = z.input<typeof UpdateCitySchema>;

export const UpdateCityActionSchema = z.object({
	card_image: z.instanceof(File).optional(),
	removed_card_image: z.string().optional(),
	full_image: z.instanceof(File).optional(),
	removed_full_image: z.string().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
	name: z.string().optional(),
});

export type UpdateCityActionData = z.infer<typeof UpdateCityActionSchema>;
