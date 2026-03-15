import { MailIcon, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { type ActionFunctionArgs, Form as RouterForm, useActionData, useNavigation } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthService } from "@workspace/shared/services/auth.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { useEffect } from "react";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { emailService } from "@workspace/shared/services/emails.service";

const forgotSchema = z.object({
	email: z
		.string()
		.email("Please enter a valid email")
		.min(1, "Email is required")
		.refine((value) => value.length > 0, { message: "Email is required" }),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();

		if (!email) {
			return { success: false, error: "Email is required" };
		}

		const result = forgotSchema.safeParse({ email });
		if (!result.success) {
			return { success: false, error: result.error.issues[0].message };
		}

		const authSvc = new AuthService(request);
		const { data, error } = await authSvc.generateLink({
			type: "recovery",
			email: email.toString().trim(),
			options: {
				redirectTo: process.env.VITE_MAIN_APP_URL + "/update-password",
			},
		});

		const recoveryLink = data?.properties?.action_link ?? null;

		if (error) {
			return { success: false, error: error.message };
		}

		if (recoveryLink == null || recoveryLink == "") {
			return { success: false, error: "Failed to generate reset link" };
		}

		await emailService.sendPasswordResetLink(recoveryLink, email);

		return { success: true, error: null };
	} catch (err: any) {
		return {
			success: false,
			error: err.message || "Failed to send reset link",
		};
	}
}

export default function ForgotPassword() {
	const actionData: ActionResponse = useActionData();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const form = useForm<ForgotFormData>({
		resolver: zodResolver(forgotSchema),
		defaultValues: { email: "" },
	});

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Password reset link sent successfully");
				form.reset();
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	return (
		<>
			<MetaDetails metaTitle="Forgot Password | WanderNest" metaDescription="Reset your password" />

			<section className="flex w-full items-center py-4 sm:px-4">
				<div className="flex flex-col gap-6 max-w-md w-full mx-auto">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="text-xl">Reset Password</CardTitle>
							<CardDescription>Enter your email to receive a reset link</CardDescription>
						</CardHeader>
						<CardContent>
							<RouterForm method="POST" className="space-y-6">
								<Form {...form}>
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<div className="relative">
														<MailIcon
															className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
															size={18}
														/>
														<Input
															className="pl-10"
															placeholder="Enter Email"
															required
															type="email"
															{...field}
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
										Send Reset Link
									</Button>
								</Form>
							</RouterForm>

							<div className="text-center text-sm mt-6">
								<a href="/login" className="text-primary hover:underline">
									Back to login
								</a>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</>
	);
}
