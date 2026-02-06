import { z } from "zod";

export const signupSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name cannot exceed 50 characters")
		.refine((val) => val.trim().length > 0, {
			message: "First name is required",
		}),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name cannot exceed 50 characters")
		.refine((val) => val.trim().length > 0, {
			message: "Last name is required",
		}),
	email: z
		.string()
		.min(1, "Email is required")
		.email()
		.refine((val) => val.trim().length > 0, {
			message: "Email is required",
		}),
	phone: z
		.string()
		.optional()
		.refine(
			(value) => {
				if (!value) return true;
				return value.trim().length > 0 && /^\d{10,}$/.test(value.replace(/\D/g, ""));
			},
			{
				message: "Phone number is required and must be at least 10 digits",
			},
		),
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

export type SignupFormData = z.infer<typeof signupSchema>;
