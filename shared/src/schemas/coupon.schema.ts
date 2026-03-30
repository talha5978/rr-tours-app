import { z } from "zod";

export const addCouponSchema = z
	.object({
		code: z
			.string()
			.min(3, "Code must be at least 3 characters")
			.max(20, "Code cannot exceed 20 characters")
			.regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers (e.g. SUMMER25)")
			.refine((code) => !!code.trim(), "Code is required"),

		coupon_type: z.enum(["MANUAL", "AUTOMATIC"]),
		discount_type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),

		discount_value: z.number().positive("Discount value must be greater than 0"),

		// Fixed for datetime-local input
		valid_from: z
			.string()
			.refine((val) => !isNaN(Date.parse(val)), "Valid from date is required")
			.refine((val) => {
				const date = new Date(val);
				return date > new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 10);
			}, "Valid from date seems too old"),

		valid_until: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid until date is required"),

		min_subtotal: z.number().positive().nullable().default(null),
		total_usage_limit: z.number().int().positive().nullable().default(null),
		per_user_limit: z.number().int().positive().nullable().default(1),

		is_active: z.boolean().default(true),
		tour_option_ids: z.array(z.number()).default([]),
	})
	.refine(
		(data) => {
			const from = new Date(data.valid_from);
			const until = new Date(data.valid_until);
			return from < until;
		},
		{
			message: "Valid until date must be after valid from date",
			path: ["valid_until"],
		},
	)
	.refine(
		(data) => {
			if (data.discount_type === "PERCENTAGE") return data.discount_value <= 100;
			return true;
		},
		{
			message: "Percentage discount cannot exceed 100%",
			path: ["discount_value"],
		},
	);

export type AddCouponSchemaType = z.infer<typeof addCouponSchema>;

export const updateCouponSchema = z
	.object({
		code: z
			.string()
			.min(3, "Code must be at least 3 characters")
			.max(20, "Code cannot exceed 20 characters")
			.regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers (e.g. SUMMER25)")
			.refine((code) => !!code.trim(), "Code is required"),

		valid_from: z
			.string()
			.refine((val) => !isNaN(Date.parse(val)), "Valid from date is required")
			.refine((val) => {
				const date = new Date(val);
				return date > new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 10);
			}, "Valid from date seems too old"),

		valid_until: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid until date is required"),

		is_active: z.boolean().default(true),
		tour_option_ids: z.array(z.number()).default([]),
	})
	.refine(
		(data) => {
			const from = new Date(data.valid_from);
			const until = new Date(data.valid_until);
			return from < until;
		},
		{
			message: "Valid until date must be after valid from date",
			path: ["valid_until"],
		},
	);

export type UpdateCouponSchemaType = z.infer<typeof updateCouponSchema>;
