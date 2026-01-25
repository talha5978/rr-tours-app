import { z } from "zod";
import {
	MetaDetailsActionDataSchema,
	MetaDetailsInputSchema,
} from "@workspace/shared/schemas/meta-details.schema";
import {
	ALLOWED_IMAGE_FORMATS,
	AVAILABILITY_OVERRIDE_TYPE,
	getSimpleImgFormats,
	MAX_IMAGE_SIZE,
} from "@workspace/shared/constants/constants";

const weekdaySchema = z.enum(["1", "2", "3", "4", "5", "6", "7"]);

const timeSlotSchema = z.object({
	label: z.string().min(1, "Time slot label is required"),
	capacity: z
		.string()
		.min(1, "Capacity is required")
		.refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
			message: "Capacity must be a non-negative number",
		}),

	is_active: z.enum(["true", "false"]),
});

const availabilityRuleSchema = z.object({
	start_date: z.string().min(1, "Start date is required"),
	end_date: z.string().min(1, "End date is required"),
	weekdays: z.array(weekdaySchema).min(1, "At least one weekday must be selected"),
	is_active: z.enum(["true", "false"]),
	time_slots: z.array(timeSlotSchema).min(1, "At least one time slot is required per rule"),
});

const availabilityOverrideSchema = z.object({
	date: z.string().min(1, "Override date is required"),
	override_type: z.enum(AVAILABILITY_OVERRIDE_TYPE),
	new_capacity: z.string().nullable(),
	time_slot_label: z.string().nullable(),
});

const TourOptionsSchema = z
	.array(
		z.object({
			name: z
				.string({ required_error: "Option name is required." })
				.min(1, "Option name is required.")
				.max(250, "Option name must be at most 250 characters.")
				.refine((value) => value.trim().length > 0, {
					message: "Option name is required.",
				}),

			isOpenDated: z.enum(["true", "false"]).default("false"),

			exclusions: z.string().optional(),
			inclusions: z.string().optional(),
			note: z.string().optional(),
			sort_order: z.string().optional(),

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

			rules: z.array(availabilityRuleSchema).default([]),
			overrides: z.array(availabilityOverrideSchema).optional().default([]),
		}),
	)
	.refine((value) => value.length > 0, {
		message: "At least one tour option is required.",
	});

const AddTourImagesSchema = z
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
	);

export const AddTourSchema = z
	.object({
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
				`Only ${getSimpleImgFormats()} image formats are allowed.`,
			),

		duration_minutes: z.string().optional(),
		free_cancelation_avilable: z.enum(["true", "false"]).default("false"),
		highlights: z.string().optional(),

		images: AddTourImagesSchema,

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

		tour_options: TourOptionsSchema,
	})
	.refine(
		(data) => {
			if (data.live_tour_guide === "true") {
				return data.live_tour_guide_langs && data.live_tour_guide_langs.length > 0;
			}
			return true;
		},
		{
			message: "At least one live tour guide language is required when live tour guide is enabled.",
			path: ["live_tour_guide_langs"],
		},
	);

export type AddTourInput = z.input<typeof AddTourSchema>;

export const AddTourActionSchema = z.object({
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
			`Only ${getSimpleImgFormats()} image formats are allowed.`,
		),

	duration_minutes: z.string().optional(),
	free_cancelation_avilable: z.enum(["true", "false"]).default("false"),
	highlights: z.string().optional(),

	images: AddTourImagesSchema,

	isActive: z.enum(["true", "false"]).default("true"),
	isFeatured: z.enum(["true", "false"]).default("false"),
	isWeelChairAccessible: z.enum(["true", "false"]).default("false"),

	know_before_you_go: z.string().optional(),

	live_tour_guide: z.enum(["true", "false"]),
	live_tour_guide_langs: z.array(z.string()).optional().default([]),

	meta_details: MetaDetailsActionDataSchema,

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

	tour_options: TourOptionsSchema,
});

export type AddTourActionDate = z.infer<typeof AddTourActionSchema>;

const UpdateTourImagesSchema = z
	.array(
		z.union([
			z
				.instanceof(File)
				.refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 1MB.")
				.refine(
					(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
					"Only JPEG, PNG, or WebP image formats are allowed.",
				)
				.optional()
				.nullable(),
			z.string().optional().nullable(),
		]),
	)
	.refine(
		(arr) =>
			arr.filter((file) => Boolean(file)).length >= 1 &&
			arr.filter((file) => Boolean(file)).length <= 4,
		{
			message: "At least one secondary image is required.",
		},
	);

export const UpdateTourSchema = z
	.object({
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

		cover_image: z.union([
			z
				.instanceof(File, { message: "Cover image is required." })
				.refine((file) => file.size <= MAX_IMAGE_SIZE, "Cover image must be less than 1MB.")
				.refine(
					(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
					`Only ${getSimpleImgFormats()} image formats are allowed.`,
				),
			z.string().min(1, "Cover image path is required."),
		]),

		images: UpdateTourImagesSchema,

		duration_minutes: z.string().optional(),
		free_cancelation_avilable: z.enum(["true", "false"]).default("false"),
		highlights: z.string().optional(),

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
					id: z.number().optional(), // Added for existing options
					name: z
						.string({ required_error: "Option name is required." })
						.min(1, "Option name is required.")
						.max(250, "Option name must be at most 250 characters.")
						.refine((value) => value.trim().length > 0, {
							message: "Option name is required.",
						}),

					isOpenDated: z.enum(["true", "false"]).default("false"),

					exclusions: z.string().optional(),
					inclusions: z.string().optional(),
					note: z.string().optional(),
					sort_order: z.string().optional(),

					prices: z
						.array(
							z.object({
								id: z.number().optional(), // Added for existing prices
								price: z
									.string({ required_error: "Price is required." })
									.min(1, "Price is required.")
									.refine((value) => value.trim().length > 0, {
										message: "Price is required.",
									}),

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

					rules: z.array(
						z.object({
							id: z.number().optional(), // Added for existing rules
							start_date: z.string().min(1, "Date is required."),
							end_date: z.string().min(1, "End date is required"),
							weekdays: z.array(weekdaySchema).min(1, "At least one weekday must be selected"),
							is_active: z.enum(["true", "false"]),
							time_slots: z
								.array(
									z.object({
										id: z.number().optional(),
										label: z.string().min(1, "Time slot label is required"),
										capacity: z
											.string()
											.min(1, "Capacity is required")
											.refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
												message: "Capacity must be a non-negative number",
											}),

										is_active: z.enum(["true", "false"]),
									}),
								)
								.refine((value) => value.length > 0, {
									message: "At least one timeslot is required.",
								}),
						}),
					),

					overrides: z.array(
						z.object({
							id: z.number().optional(),
							date: z.string().min(1, "Override date is required"),
							override_type: z.enum(AVAILABILITY_OVERRIDE_TYPE),
							new_capacity: z.string().nullable(),
							time_slot_label: z.string().nullable(),
						}),
					),
				}),
			)
			.refine((value) => value.length > 0, {
				message: "At least one tour option is required.",
			}),
	})
	.refine(
		(data) => {
			if (data.live_tour_guide === "true") {
				return data.live_tour_guide_langs && data.live_tour_guide_langs.length > 0;
			}
			return true;
		},
		{
			message: "At least one live tour guide language is required when live tour guide is enabled.",
			path: ["live_tour_guide_langs"],
		},
	);

export type UpdateTourInput = z.input<typeof UpdateTourSchema>;

// UPdation in action
const TourOptionNewSchema = z.object({
	name: z.string(),
	inclusions: z.string().nullable().optional(),
	exclusions: z.string().nullable().optional(),
	note: z.string().nullable().optional(),
	sort_order: z.number().optional(),
	isOpenDated: z.boolean().optional(),
});

// Tour Option for update
const TourOptionUpdateSchema = z.object({
	id: z.number(),
	name: z.string().optional(),
	inclusions: z.string().nullable().optional(),
	exclusions: z.string().nullable().optional(),
	note: z.string().nullable().optional(),
	sort_order: z.number().optional(),
	isOpenDated: z.boolean().optional(),
});

// Price for new
const TourOptionPriceNewSchema = z.object({
	tour_option_id: z.union([z.number(), z.string()]), // number for existing, string for temp
	participant_type_id: z.number(),
	price: z.number(),
});

// Price for update
const TourOptionPriceUpdateSchema = z.object({
	id: z.number(),
	price: z.number().optional(),
	participant_type_id: z.number().optional(),
});

// Time Slots (new / delete only)
const TimeSlotNewSchema = z.object({
	label: z.string().min(1, "Time slot label is required"),
	capacity: z.number().min(0, "Capacity must be non-negative"),
	is_active: z.boolean(),
	availability_rule_id: z.union([z.number(), z.string()]), // number for existing rule, string for temp new rule
});

// Availability Rules (new / delete only)
const AvailabilityRuleNewSchema = z.object({
	tour_option_id: z.number(),
	start_date: z.string().min(1, "Start date is required"),
	end_date: z.string().min(1, "End date is required"),
	weekdays: z.array(z.number()).min(1, "At least one weekday required"),
	is_active: z.boolean(),
});

// ────────────────────────────────────────────────
// Overrides (new / delete only)
const AvailabilityOverrideNewSchema = z.object({
	tour_option_id: z.number(),
	date: z.string().min(1, "Override date required"),
	override_type: z.enum(AVAILABILITY_OVERRIDE_TYPE),
	new_capacity: z.number().min(0).nullable().optional(),
	time_slot_id: z.number().nullable().optional(), // null = whole day
});

// Full tour_options_updates
const TourOptionsUpdatesSchema = z.object({
	new_options: z.array(TourOptionNewSchema).optional(),
	deleted_options: z.array(z.number()).optional(),
	updated_options: z.array(TourOptionUpdateSchema).optional(),

	new_prices: z.array(TourOptionPriceNewSchema).optional(),
	deleted_prices: z.array(z.number()).optional(),
	updated_prices: z.array(TourOptionPriceUpdateSchema).optional(),

	// Availability Rules (new / delete only)
	new_rules: z.array(AvailabilityRuleNewSchema).optional(),
	deleted_rules: z.array(z.number()).optional(),

	// Time Slots (new / delete only)
	new_time_slots: z.array(TimeSlotNewSchema).optional(),
	deleted_time_slots: z.array(z.number()).optional(),

	// Overrides (new / delete only)
	new_overrides: z.array(AvailabilityOverrideNewSchema).optional(),
	deleted_overrides: z.array(z.number()).optional(),
});

// basic details schemafor update
const PartialUpdateTourSchema = z.object({
	address_link: z.string().optional(),
	address_name: z.string().optional(),
	age_health_restrictions: z.string().nullable().optional(),
	cancellation_policy: z.number().optional(),

	city_id: z.number().optional(),

	cover_image: z
		.union([
			z
				.instanceof(File, { message: "Cover image is required." })
				.refine((file) => file.size <= MAX_IMAGE_SIZE, "Cover image must be less than 1MB.")
				.refine(
					(file) => ALLOWED_IMAGE_FORMATS.includes(file.type),
					`Only ${getSimpleImgFormats()} image formats are allowed.`,
				),
			z.string().min(1, "Cover image path is required."),
		])
		.optional(),

	images: UpdateTourImagesSchema.optional(),

	duration_minutes: z.number().optional(),
	free_cancelation_avilable: z.boolean().default(false).optional(),
	highlights: z.string().nullable().optional(),

	isActive: z.boolean().default(true).optional(),
	isFeatured: z.boolean().default(false).optional(),
	isWeelChairAccessible: z.boolean().default(false).optional(),

	know_before_you_go: z.string().nullable().optional(),

	live_tour_guide: z.boolean().optional(),
	live_tour_guide_langs: z.string().nullable().optional(),

	name: z.string().optional(),

	overview: z.string().optional(),

	provider: z.number().optional(),

	tour_category_id: z.number().optional(),
});

// Main action payload - ALL OPTIONAL
export const UpdateTourActionPayloadSchema = z.object({
	tour_update: PartialUpdateTourSchema.optional(),
	added_tags: z.array(z.number()).optional(),
	removed_tags: z.array(z.number()).optional(),
	tour_options_updates: TourOptionsUpdatesSchema.optional(),
	removed_cover_image: z.string().optional(),
	meta_details: z
		.object({
			meta_title: z.string().optional(),
			meta_description: z.string().optional(),
			url_key: z.string().optional(),
			meta_keywords: z.string().optional(),
		})
		.optional(),
	removed_images: z.array(z.string()).optional(),
});

export type UpdateTourActionPayload = z.infer<typeof UpdateTourActionPayloadSchema>;
