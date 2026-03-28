import { EyeIcon, EyeOffIcon, Loader2, LockIcon, MailIcon, UserIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	type ActionFunctionArgs,
	Link,
	type LoaderFunctionArgs,
	redirect,
	useActionData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AuthService } from "@workspace/shared/services/auth.service";
import { signupSchema, type SignupFormData } from "@workspace/shared/schemas/signup.schema";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { PhoneInput } from "~/components/Booking/phone-number-input";
import { emailService } from "@workspace/shared/services/emails.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const firstName = (formData.get("firstName") as string)?.trim();
		const lastName = (formData.get("lastName") as string)?.trim();
		const email = (formData.get("email") as string)?.trim();
		const phone = (formData.get("phone") as string)?.trim() || undefined;
		const password = (formData.get("password") as string)?.trim();

		if (!firstName || !lastName || !email || !password) {
			return { error: "Required fields are missing", success: false };
		}

		const parseResult = signupSchema.safeParse({
			firstName,
			lastName,
			email,
			phone,
			password,
		});
		if (!parseResult.success) {
			const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
			return { error: firstError, success: false };
		}

		const authSvc = new AuthService(request);
		const { error, session, success, user } = await authSvc.signUpWithPasswordAndProfile({
			firstName,
			lastName,
			email,
			phone,
			password,
		});

		if (error || !success || !user || !session) {
			return { error: error || "Failed to sign up", success: false };
		}

		await emailService.sendWelcomeEmail(firstName, email);

		const { error: loginErr, headers } = await authSvc.loginWithPassword({ email, password });

		if (loginErr) {
			return { error: loginErr.message || "Failed to login", success: false };
		}

		let response = new Response(JSON.stringify({ success: true, error: null }), {
			status: 200,
			statusText: "OK",
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": headers.get("Set-Cookie") || "",
			},
		});

		const { authId } = genAuthSecurity(request);
		if (authId) {
			await cacheService.invalidate(CACHE_KEYS.auth.session("FP", authId));
		}

		return response;
	} catch (error: any) {
		const errorMessage = error instanceof ApiError ? error.message : error.message || "Failed to sign up";
		return { success: false, error: errorMessage };
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const resp = await getCurrentUser(request);
	if (resp?.user?.id) return redirect("/");

	return { user: null };
}

export default function SignupPage() {
	const actionData: ActionResponse | undefined = useActionData();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const [showPassword, setShowPassword] = useState(false);
	const togglePasswordVisibility = () => setShowPassword(!showPassword);

	const form = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		mode: "onChange",
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			password: "",
		},
	});

	const { handleSubmit, control } = form;

	const onFormSubmit = (data: SignupFormData) => {
		const formData = new FormData();
		formData.append("firstName", data.firstName.trim());
		formData.append("lastName", data.lastName.trim());
		formData.append("email", data.email.trim());
		if (data.phone) formData.append("phone", data.phone.trim());
		formData.append("password", data.password.trim());
		submit(formData, { method: "POST", action: "/signup" });
	};

	const submit = useSubmit();

	const handleGoogleSignup = () => {
		const formData = new FormData();
		formData.append("redirectToOrigin", window.location.origin);
		submit(formData, {
			method: "POST",
			action: "/login/google?intent=signup",
			replace: true,
			navigate: false,
		});
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Signed up successfully.");
				navigate("/login", { replace: true });
			} else if (actionData.error) {
				if (actionData.error === "Failed to login") {
					navigate("/login", { replace: true });
				} else {
					toast.error(actionData.error, { description: "Please try again" });
				}
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Sign Up | WanderNest"
				metaDescription="Create an account to book tours and manage your bookings"
				metaKeywords="WanderNest"
			/>

			<section className="flex w-full my-6 items-center py-4 sm:px-4">
				<div className="flex flex-col gap-6 max-w-md w-full mx-auto">
					<form onSubmit={handleSubmit(onFormSubmit)}>
						<Form {...form}>
							<div className="flex flex-col gap-6">
								<Card>
									<CardHeader className="text-center">
										<CardTitle className="text-xl">Create Account</CardTitle>
										<CardDescription>Sign up with Google or email</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex *:flex-1 gap-2 sm:flex-row flex-col">
											<Button
												variant="outline"
												type="button"
												className="w-full"
												onClick={handleGoogleSignup}
												disabled={isSubmitting}
											>
												<GoogleIcon />
												Sign up with Google
											</Button>
										</div>

										<div className="relative my-4 flex items-center justify-center overflow-hidden">
											<Separator />
											<div className="px-2 text-center bg-card text-sm">OR</div>
											<Separator />
										</div>

										<div className="flex flex-col gap-4 my-4">
											<div className="grid sm:grid-cols-2 gap-4">
												<FormField
													control={control}
													name="firstName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>First Name</FormLabel>
															<FormControl>
																<div className="relative">
																	<UserIcon
																		className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
																		width={18}
																	/>
																	<Input
																		placeholder="e.g. John"
																		className="pl-8"
																		{...field}
																	/>
																</div>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="lastName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Last Name</FormLabel>
															<FormControl>
																<div className="relative">
																	<UserIcon
																		className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
																		width={18}
																	/>
																	<Input
																		placeholder="e.g. Smith"
																		className="pl-8"
																		{...field}
																	/>
																</div>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Email</FormLabel>
														<FormControl>
															<div className="relative">
																<MailIcon
																	className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
																	width={18}
																/>
																<Input
																	placeholder="user@email.com"
																	className="pl-8"
																	{...field}
																/>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={control}
												name="phone"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Phone (optional)</FormLabel>
														<FormControl>
															<PhoneInput
																value={field.value}
																onChange={field.onChange}
																placeholder="Enter phone number"
																defaultCountry="AE"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={control}
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Password</FormLabel>
														<FormControl>
															<div className="relative">
																<LockIcon
																	className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
																	width={18}
																/>
																<Input
																	type={showPassword ? "text" : "password"}
																	placeholder="Password"
																	className="pl-8 pr-10"
																	{...field}
																/>
																<button
																	type="button"
																	onClick={togglePasswordVisibility}
																	className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
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
										</div>

										<Button type="submit" className="w-full" disabled={isSubmitting}>
											{isSubmitting && (
												<Loader2 className="animate-spin mr-2 h-4 w-4" />
											)}
											Create Account
										</Button>

										<div className="flex justify-center gap-1 items-center mt-4">
											<p className="text-sm">Already have an account?</p>
											<Link
												to="/login"
												className="text-sm underline-offset-4 hover:underline"
											>
												Login
											</Link>
										</div>
									</CardContent>
								</Card>
							</div>
						</Form>
					</form>
				</div>
			</section>
		</>
	);
}

const GoogleIcon = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="1em" height="1em">
			<path
				fill="#fff"
				d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.33 74.33 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.16 36.16 0 0 1-13.93 5.5a41.29 41.29 0 0 1-15.1 0A37.16 37.16 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.31 38.31 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.28 34.28 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38z"
			></path>
			<path
				fill="#e33629"
				d="M44.59 4.21a64 64 0 0 1 42.61.37a61.22 61.22 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21z"
			></path>
			<path
				fill="#f8bd00"
				d="M3.26 51.5a62.93 62.93 0 0 1 5.5-15.9l20.73 16.09a38.31 38.31 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9z"
			></path>
			<path
				fill="#587dbd"
				d="M65.27 52.15h59.52a74.33 74.33 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"
			></path>
			<path
				fill="#319f43"
				d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.16 37.16 0 0 0 14.08 6.08a41.29 41.29 0 0 0 15.1 0a36.16 36.16 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.73 63.73 0 0 1 8.75 92.4z"
			></path>
		</svg>
	);
};
