// app/update-password/page.tsx
import { Fragment, useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2, LockIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useActionData, useNavigate, useSearchParams } from "react-router";
import { ActionResponse } from "@workspace/shared/types/action-data";
import { useSupabaseClient } from "@workspace/shared/hooks/use-supabase-client";
import { MetaDetails } from "~/components/SEO/MetaDetails";

const updatePasswordSchema = z
	.object({
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
		confirmPassword: z
			.string({ required_error: "Confirm Password is required" })
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
				"Confirm Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
			)
			.min(1, "Confirm Password is required")
			.refine((val) => val.trim().length > 0, {
				message: "Confirm Password is required",
			}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export const action = async () => {};

export const loader = async () => {
	return null;
};

export default function UpdatePassword() {
	const actionData: ActionResponse = useActionData();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [showPassword, setShowPassword] = useState(false);
	const [isRecoveryMode, setIsRecoveryMode] = useState(false);
	const [isVerifying, setIsVerifying] = useState(true);
	const supabase = useSupabaseClient();

	const form = useForm<UpdatePasswordForm>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const isSubmitting = form.formState.isSubmitting;

	useEffect(() => {
		if (supabase) {
			const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
				// console.log("Auth event:", event, "Session:", !!session);
				if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
					setIsRecoveryMode(true);
					setIsVerifying(false);
				}
			});

			return () => {
				authListener.subscription.unsubscribe();
			};
		}
	}, [supabase]);

	useEffect(() => {
		if (!supabase) {
			setIsVerifying(false);
			return;
		}

		let isMounted = true;
		const timeoutId = setTimeout(() => {
			if (isMounted && isVerifying) {
				setIsVerifying(false);
			}
		}, 8000);

		const hash = window.location.hash.substring(1);
		const params = new URLSearchParams(hash);
		const access_token = params.get("access_token");
		const refresh_token = params.get("refresh_token");
		const type = params.get("type");

		const code = searchParams.get("code");

		// console.log("Hash params:", { access_token, type });
		// console.log("Query code:", code);

		if (access_token && refresh_token && type === "recovery") {
			supabase.auth.setSession({ access_token, refresh_token }).then(({ data: _, error }) => {
				if (error) {
					console.log("Set session error:", error);
					toast.error(error.message);
					if (isMounted) setIsVerifying(false);
				} else {
					console.log("Session set from hash");
					setIsRecoveryMode(true);
					if (isMounted) setIsVerifying(false);
				}
			});
		} else if (code) {
			supabase.auth.verifyOtp({ type: "recovery", token_hash: code }).then(({ data, error }) => {
				console.log("verifyOtp result:", data, error);
				if (error) {
					toast.error(error.message);
					if (isMounted) setIsVerifying(false);
				} else {
					setIsRecoveryMode(true);
					if (isMounted) setIsVerifying(false);
				}
			});
		} else {
			supabase.auth.getSession().then(({ data: { session }, error: _error }) => {
				// console.log("getSession result:", !!session, error);
				if (session) {
					setIsRecoveryMode(true);
				}
				if (isMounted) setIsVerifying(false);
			});
		}

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [supabase, searchParams]);

	const onSubmit = async (values: UpdatePasswordForm) => {
		try {
			if (!supabase) return;
			const { data, error } = await supabase.auth.updateUser({ password: values.password.trim() });
			// console.log("updateUser result:", data, error);
			if (error) throw error;
			if (data) {
				toast.success("Password updated successfully!");
				navigate("/login");
				form.reset();
			}
		} catch (err: any) {
			toast.error(err?.message || "There was an error updating your password.");
		}
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Password changed successfully");
				navigate("/login");
				form.reset();
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	if (isVerifying) {
		return (
			<>
				<MetaDetails metaTitle="Verifying... | WanderNest" metaDescription="Please wait" />
				<div className="flex min-h-[50vh] items-center justify-center">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			</>
		);
	}

	if (!isRecoveryMode) {
		return (
			<Fragment>
				<MetaDetails
					metaTitle="Update Password | WanderNest"
					metaDescription="Update your password"
				/>
				<div className="text-center py-10">
					<h2 className="text-destructive text-base">
						Invalid or expired reset link. Please request a new one.
					</h2>
					<a href="/forgot-password" className="text-primary underline mt-4 inline-block">
						Request new reset link
					</a>
				</div>
			</Fragment>
		);
	}
	console.log("isRecoveryMode: ", isRecoveryMode);

	return (
		<>
			<MetaDetails metaTitle="Update Password | WanderNest" metaDescription="Update your password" />
			<section className="flex w-full items-center py-4 sm:px-4">
				<div className="flex flex-col gap-6 max-w-md w-full mx-auto">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="text-xl">Set New Password</CardTitle>
							<CardDescription>Enter your new password below</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>New Password</FormLabel>
												<FormControl>
													<div className="relative">
														<LockIcon
															className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
															size={18}
														/>
														<Input
															type={showPassword ? "text" : "password"}
															className="pl-10 pr-10"
															placeholder="New Password"
															spellCheck={false}
															{...field}
														/>
														<button
															type="button"
															onClick={() => setShowPassword(!showPassword)}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
														>
															{showPassword ? (
																<EyeOffIcon size={18} />
															) : (
																<EyeIcon size={18} />
															)}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm Password</FormLabel>
												<FormControl>
													<div className="relative">
														<LockIcon
															className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
															size={18}
														/>
														<Input
															type={showPassword ? "text" : "password"}
															className="pl-10 pr-10"
															placeholder="Confirm Password"
															spellCheck={false}
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
										Update Password
									</Button>
								</form>
							</Form>

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
