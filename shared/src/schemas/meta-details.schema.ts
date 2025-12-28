import { z } from "zod";

export const MetaDetailsInputSchema = z.object({
	meta_description: z
		.string({ required_error: "Meta description is required." })
		.min(1, "Meta description is required.")
		.max(400, "Meta description must be at most 160 characters.")
		.refine((value) => value.trim().length > 0, {
			message: "Meta description is required.",
		}),

	meta_title: z
		.string({ required_error: "Meta title is required." })
		.min(1, "Meta title is required.")
		.refine((value) => value.trim().length > 0, {
			message: "Meta title is required.",
		}),

	url_key: z
		.string({ required_error: "URL key is required." })
		.min(1, "URL key is required.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"URL key must be lowercase, alphanumeric, and hyphen-separated only.",
		)
		.refine((value) => value.trim().length > 0, {
			message: "URL key is required.",
		}),

	meta_keywords: z.array(z.string()).optional().default([]),
});

export type MetaDetailsInput = z.infer<typeof MetaDetailsInputSchema>;

export const MetaDetailsActionDataSchema = z.object({
	meta_title: z.string(),
	meta_description: z.string(),
	url_key: z.string(),
	meta_keywords: z.string(),
});

export type MetaDetailsActionData = z.infer<typeof MetaDetailsActionDataSchema>;
