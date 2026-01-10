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

export const customerBookingSchema = createBookingSchema.pick({
	customer_name: true,
	customer_email: true,
	customer_phone: true,
});

export type CustomerInput = z.infer<typeof customerBookingSchema>;
