import { z } from "zod";
import {
	ALLOWED_IMAGE_FORMATS,
	getSimpleImgFormats,
	MAX_IMAGE_SIZE,
} from "@workspace/shared/constants/constants";

export const AddTagSchema = z.object({
	name: z
		.string({ required_error: "Tag name is required." })
		.min(1, "Tag name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Tag name is required.",
		}),

	image: z
		.instanceof(File, { message: "Image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			`Only ${getSimpleImgFormats()} image formats are allowed.`,
		),
});

export type AddTagInput = z.input<typeof AddTagSchema>;

export const UpdateTagSchema = z.object({
	name: z
		.string({ required_error: "Tag name is required." })
		.min(1, "Tag name is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Tag name is required.",
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
});

export type UpdateTagInput = z.input<typeof UpdateTagSchema>;

export const UpdateTagActionSchema = z.object({
	image: z.instanceof(File).optional(),
	removed_image: z.string().optional(),
	name: z.string().optional(),
});

export type UpdateTagActionData = z.infer<typeof UpdateTagActionSchema>;
