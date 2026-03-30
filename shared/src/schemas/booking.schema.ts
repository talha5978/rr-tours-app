import { BOOKING_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants/constants";
import type { Database } from "@workspace/shared/types/supabase";
import z from "zod";

const participantSchema = z.object({
	participant_type_id: z.number().int().positive(),
	quantity: z.number().int().positive(),
	unit_price: z.number().nonnegative(),
});

export const createBookingSchema = z.object({
	customer_name: z
		.string()
		.min(1, "Name is required")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required",
		}),
	customer_email: z.string().email("Invalid email address").min(1, "Email is required"),
	customer_phone: z.string().min(10, "Phone number must be at least 10 digits"),
	tour_id: z.string().uuid("Invalid tour ID"),
	tour_name: z.string().min(1, "Tour name is required"),
	tour_option_id: z.number().int().positive("Invalid tour option ID"),
	tour_option_name: z.string().min(1, "Tour option name is required"),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
	timeslot: z.string().min(1, "Timeslot is required"),
	isOpenDated: z.boolean(),
	participants: z.array(participantSchema).min(1, "At least one participant is required"),
	subtotal: z.number().nonnegative("Subtotal must be non-negative"),
	discount: z.number().nonnegative("Discount must be non-negative"),
	taxes: z.number().nonnegative("Taxes must be non-negative"),
	total: z.number().nonnegative("Total must be non-negative"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createBookingFromCartSchema = z.object({
	customer_name: z.string().min(1, "Name is required"),
	customer_email: z.string().email("Invalid email").min(1),
	customer_phone: z.string().min(10, "Phone number must be at least 10 digits"),
	cart_id: z.number().positive("Cart ID is required"),
	added_by: z.string().nullable(),
	discount: z.number().nonnegative("Discount must be non-negative").default(0),
});

export type CreateBookingFromCartInput = z.infer<typeof createBookingFromCartSchema>;

export const customerBookingSchema = createBookingSchema.pick({
	customer_name: true,
	customer_email: true,
	customer_phone: true,
});

export type CustomerInput = z.infer<typeof customerBookingSchema>;

export const UpdateBookingSchema = z.object({
	booking_status: z.enum(BOOKING_STATUS),
	payment_status: z.enum(PAYMENT_STATUS),

	customer_name: z
		.string()
		.min(1, "Name is required")
		.refine((value) => value.trim().length > 0, {
			message: "Name is required",
		}),
	customer_email: z.string().email("Invalid email address").min(1, "Email is required"),
	customer_phone: z.string().min(10, "Phone number must be at least 10 digits"),

	payment_ref: z.string().optional().nullable(), // READ ONLY FIELD

	admin_note: z.string().nullable().optional(),

	discount: z.string(),
	taxes: z.string(),

	participants_unit_prices: z.array(
		z.object({
			booking_participant_id: z.string(),
			quantity: z.number().int().positive(),
			unit_price: z.number().nonnegative(),
		}),
	),

	item_dates: z.array(
		z.object({
			booking_item_id: z.string(),
			preffered_date: z.date().nullable().optional(),
			preffered_time: z.string().nullable().optional(),
			confirmed_date: z.date().nullable().optional(),
			confirmed_time: z.string().nullable().optional(),
		}),
	),
});

export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;

export type UpdateBookingActionData = {
	booking_status?: Database["public"]["Enums"]["booking_status_enum"];
	payment_status?: Database["public"]["Enums"]["payment_status_enum"];
	customer_name?: string | null;
	customer_email?: string | null;
	customer_phone?: string | null;
	discount?: number;
	taxes?: number;
	participants_unit_prices?:
		| {
				booking_participant_id: string;
				quantity: number;
				unit_price: number;
		  }[]
		| null;
	item_dates?: {
		booking_item_id: string;
		preffered_date: string | null;
		preffered_time: string | null;
		confirmed_date: string | null;
		confirmed_time: string | null;
	}[];
	admin_note?: string | null;
};
