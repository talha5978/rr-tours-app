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
	TIMESLOT_SEAT_TYPE,
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

					seat_type: z.enum(TIMESLOT_SEAT_TYPE),

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

					availabilities: z
						.array(
							z.object({
								id: z.number().optional(), // Added for existing availabilities
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
											id: z.number().optional(), // tour_availability_slots.id
											time_slot_id: z.number().optional(), // tour_time_slots.id
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

// Availability for new
const TourAvailabilityNewSchema = z.object({
	tour_option_id: z.union([z.number(), z.string()]),
	date: z.string(),
	isActive: z.boolean(),
});

// Availability for update
const TourAvailabilityUpdateSchema = z.object({
	id: z.number(),
	isActive: z.boolean(),
});

// Slot for new
const TourAvailabilitySlotNewSchema = z.object({
	availability_id: z.union([z.number(), z.string()]),
	time: z.string(),
	label: z.string().nullable().optional(),
	sort_order: z.number().optional(),
	available_seats: z.number().nullable().optional(),
	seat_type: z.enum(["UNLIMITED", "LIMITED"] as const),
});

// Slot for update
const TourAvailabilitySlotUpdateSchema = z.object({
	id: z.number(),
	available_seats: z.number().nullable().optional(),
	seat_type: z.enum(["UNLIMITED", "LIMITED"] as const).optional(),
});

// Time slot for new
const TourTimeSlotNewSchema = z.object({
	time: z.string(),
	label: z.string().nullable().optional(),
	sort_order: z.number().optional(),
});

// Time slot for update
const TourTimeSlotUpdateSchema = z.object({
	id: z.number(),
	label: z.string().nullable().optional(),
	sort_order: z.number().optional(),
});

// Full tour_options_updates
const TourOptionsUpdatesSchema = z.object({
	new_options: z.array(TourOptionNewSchema).optional(),
	deleted_options: z.array(z.number()).optional(),
	updated_options: z.array(TourOptionUpdateSchema).optional(),

	new_prices: z.array(TourOptionPriceNewSchema).optional(),
	deleted_prices: z.array(z.number()).optional(),
	updated_prices: z.array(TourOptionPriceUpdateSchema).optional(),

	new_availabilities: z.array(TourAvailabilityNewSchema).optional(),
	deleted_availabilities: z.array(z.number()).optional(),
	updated_availabilities: z.array(TourAvailabilityUpdateSchema).optional(),

	new_slots: z.array(TourAvailabilitySlotNewSchema).optional(),
	deleted_slots: z.array(z.number()).optional(),
	updated_slots: z.array(TourAvailabilitySlotUpdateSchema).optional(),

	new_timeslots: z.array(TourTimeSlotNewSchema).optional(),
	deleted_timeslots: z.array(z.number()).optional(),
	updated_timeslots: z.array(TourTimeSlotUpdateSchema).optional(),
});

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
