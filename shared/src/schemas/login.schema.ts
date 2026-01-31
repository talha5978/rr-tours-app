import { z } from "zod";

export const onlyEmailLoginSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email()
		.refine((val) => val.trim().length > 0, {
			message: "Email is required",
		}),
});

export type onlyEmailLoginFormData = z.infer<typeof onlyEmailLoginSchema>;

export const emailPasswordLoginSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email()
		.refine((val) => val.trim().length > 0, {
			message: "Email is required",
		}),
	password: z
		.string({ required_error: "Password is required" })
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
			"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
		)
		.min(1, "Password is required")
		.refine((val) => val.trim().length > 0, {
			message: "Password is required",
		}),
});

export type emailPasswordLoginFormData = z.infer<typeof emailPasswordLoginSchema>;
