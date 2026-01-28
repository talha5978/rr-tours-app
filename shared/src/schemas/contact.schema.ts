import { z } from "zod";

export const contactSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email()
		.refine((value) => value.trim().length > 0, {
			message: "Email is required",
		}),
	full_name: z
		.string({ required_error: "Full name is required" })
		.min(1, "Full name is required")
		.refine((value) => value.trim().length > 0, {
			message: "Full name is required",
		}),
	message: z
		.string({ required_error: "Message is required" })
		.min(1, "Message is required")
		.refine((value) => value.trim().length > 0, {
			message: "Message is required",
		}),
	subject: z
		.string({ required_error: "Subject is required" })
		.min(1, "Subject is required")
		.refine((value) => value.trim().length > 0, {
			message: "Subject is required",
		}),
});

export type contactFormData = z.infer<typeof contactSchema>;
