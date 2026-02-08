import z from "zod";

export const profileUpdateSchema = z.object({
	first_name: z.string().min(1, "First name is required").max(50),
	last_name: z.string().min(1, "Last name is required").max(50),
	phone_number: z.string().optional(),
	country: z.string().optional(),
});

export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
