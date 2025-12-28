import { z } from "zod";

export const OtpSchema = z.object({
	email: z.string({ required_error: "Email is required" }).email(),
	token: z.string({ required_error: "OTP is required" }).length(8, "OTP must be exactly 8 digits"),
});

export type OtpFormData = z.infer<typeof OtpSchema>;
