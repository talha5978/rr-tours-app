import { z } from "zod";

export const onlyEmailLoginSchema = z.object({
	email: z.string({ required_error: "Email is required" }).min(1, "Email is required").email(),
});

export type onlyEmailLoginFormData = z.infer<typeof onlyEmailLoginSchema>;

export const emailPasswordLoginSchema = z.object({
	email: z.string({ required_error: "Email is required" }).min(1, "Email is required").email(),
	password: z
		.string({ required_error: "Password is required" })
		.regex(
			/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
			"Password must be at least 8 characters long and contain at least one letter and one number",
		)
		.min(1, "Password is required"),
});

export type emailPasswordLoginFormData = z.infer<typeof emailPasswordLoginSchema>;
