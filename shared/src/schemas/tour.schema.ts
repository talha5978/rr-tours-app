import { z } from "zod";
import {
	MetaDetailsActionDataSchema,
	MetaDetailsInputSchema,
} from "@workspace/shared/schemas/meta-details.schema";
import {
	ALLOWED_IMAGE_FORMATS,
	getSimpleImgFormats,
	MAX_IMAGE_SIZE,
	TIMESLOT_SEAT_TYPE,
} from "@workspace/shared/constants/constants";

export const AddTourSchema = z.object({
	address_link: z.string().optional(),
	address_name: z.string().optional(),
	age_health_restrictions: z.string().optional(),
	cancellation_policy: z.string().optional(),

	city_id: z
		.string({ required_error: "City is required." })
		.min(1, "City is required.")
		.refine((value) => value.trim().length > 0, {
			message: "City is required.",
		}),

	cover_image: z
		.instanceof(File, { message: "Cover image is required." })
		.refine((file) => file.size <= MAX_IMAGE_SIZE, "Cover image must be less than 1MB.")
		.refine(
			(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
			"Only JPEG, PNG, or WebP image formats are allowed.",
		),

	duration_minutes: z.string().optional(),
	free_cancelation_avilable: z.enum(["true", "false"]).default("false"),
	highlights: z.string().optional(),

	images: z
		.array(
			z
				.instanceof(File)
				.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
				.refine(
					(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
					"Only JPEG, PNG, or WebP image formats are allowed.",
				)
				.optional()
				.nullable(),
		)
		.refine(
			(arr) =>
				arr.filter((file) => Boolean(file)).length >= 1 &&
				arr.filter((file) => Boolean(file)).length <= 4,
			{
				message: "At least one secondary image is required.",
			},
		),

	isActive: z.enum(["true", "false"]).default("true"),
	isFeatured: z.enum(["true", "false"]).default("false"),
	isWeelChairAccessible: z.enum(["true", "false"]).default("false"),

	know_before_you_go: z.string().optional(),

	live_tour_guide: z.enum(["true", "false"]),
	live_tour_guide_langs: z.array(z.string()).optional().default([]),

	meta_details: MetaDetailsInputSchema,

	name: z
		.string({ required_error: "Name is required." })
		.min(1, "Name is required.")
		.max(250, "Name must be at most 250 characters.")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required.",
		}),

	overview: z
		.string({ required_error: "Overview is required." })
		.min(1, "Overview is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Overview is required.",
		}),

	provider: z.string().optional(),

	tour_category_id: z
		.string({
			required_error: "Category is required.",
		})
		.min(1, "Category is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Category is required.",
		}),

	tags: z.array(z.string()).optional(),

	tour_options: z
		.array(
			z.object({
				name: z
					.string({ required_error: "Option name is required." })
					.min(1, "Option name is required.")
					.max(250, "Option name must be at most 250 characters.")
					.refine((value) => value.trim().length > 0, {
						message: "Option name is required.",
					}),

				exclusions: z.string().optional(),
				inclusions: z.string().optional(),
				note: z.string().optional(),
				sort_order: z.string().optional(),

				seat_type: z.enum(TIMESLOT_SEAT_TYPE),

				prices: z
					.array(
						z.object({
							price: z
								.string({ required_error: "Price is required." })
								.min(1, "Price is required.")
								.refine((value) => value.trim().length > 0, {
									message: "Price is required.",
								}),

							// participant id from participant table
							participant: z
								.string({ required_error: "Participant is required." })
								.min(1, "Participant is required.")
								.refine((value) => value.trim().length > 0, {
									message: "Participant is required.",
								}),
						}),
					)
					.refine((value) => value.length > 0, {
						message: "At least one price is required.",
					}),

				availablities: z
					.array(
						z.object({
							date: z
								.string({ required_error: "Date is required." })
								.min(1, "Date is required.")
								.refine((value) => value.trim().length > 0, {
									message: "Date is required.",
								}),

							isActive: z.enum(["true", "false"]),
							timeslots: z
								.array(
									z.object({
										time: z
											.string({ required_error: "Time is required." })
											.min(1, "Time is required."),
										label: z.string().optional(),
										sort_order: z.string().optional(),
										available_seats: z.string().nullable(),
									}),
								)
								.refine((value) => value.length > 0, {
									message: "At least one timeslot is required.",
								}),
						}),
					)
					.optional(),
			}),
		)
		.refine((value) => value.length > 0, {
			message: "At least one tour option is required.",
		}),
});

export type AddTourInput = z.input<typeof AddTourSchema>;

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
