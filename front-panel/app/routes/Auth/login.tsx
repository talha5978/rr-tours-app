import { EyeIcon, EyeOffIcon, Loader2, LockIcon, MailIcon } from "lucide-react";
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
	useSearchParams,
	useSubmit,
} from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AuthService } from "@workspace/shared/services/auth.service";
import {
	type emailPasswordLoginFormData,
	emailPasswordLoginSchema,
} from "@workspace/shared/schemas/login.schema";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();
		const password = (formData.get("password") as string)?.trim();

		if (!email || !password) {
			return { error: "Email and password are required", success: false };
		}

		const parseResult = emailPasswordLoginSchema.safeParse({ email, password });
		if (!parseResult.success) {
			const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
			return { error: firstError, success: false };
		}

		const authSvc = new AuthService(request);
		const { error, headers } = await authSvc.loginWithPassword({ email, password });

		if (error) {
			return { error: error.message || "Failed to login", success: false };
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
		const errorMessage = error instanceof ApiError ? error.message : error.message || "Failed to login";

		return {
			success: false,
			error: errorMessage,
		};
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const resp = await getCurrentUser(request);
	if (resp?.user?.id) return redirect("/");

	return { user: null };
}

function LoginPage() {
	const actionData: ActionResponse | undefined = useActionData();
	const [searchParams] = useSearchParams();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const [showPassword, setShowPassword] = useState(false);
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const form = useForm<emailPasswordLoginFormData>({
		resolver: zodResolver(emailPasswordLoginSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { handleSubmit, control } = form;

	const onFormSubmit = (data: emailPasswordLoginFormData) => {
		const formData = new FormData();
		formData.append("email", data.email.trim());
		formData.append("password", data.password.trim());
		submit(formData, { method: "POST", action: "/login" });
	};

	const submit = useSubmit();

	const handleGoogleLogin = () => {
		const formData = new FormData();
		formData.append("redirectToOrigin", window.location.origin);
		submit(formData, { method: "POST", action: "/login/google", replace: true });
	};

	useEffect(() => {
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		if (error) {
			let message = "Login failed. Please try again.";

			if (errorDescription?.includes("Database error saving new user")) {
				message = "Failed to create account — server configuration issue (contact support)";
			} else if (errorDescription) {
				message = decodeURIComponent(errorDescription.replace(/\+/g, " "));
			}

			toast.error(message);

			// Clean URL so error doesn't stay when user retries
			navigate("/login", { replace: true });
		}
	}, [searchParams, navigate]);

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Logged in successfully");
				navigate("/", { replace: true });
			} else if (actionData.error) {
				toast.error(actionData.error, {
					description: "Please try again",
				});
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Login | WanderNest"
				metaDescription="Login into our website and add reviews and book tour tickets without any hassle"
				metaKeywords="WanderNest"
			/>

			<section className="flex w-full my-6 items-center py-4 sm:px-4">
				<div className="flex flex-col gap-6 max-w-md w-full mx-auto">
					<form action="" onSubmit={handleSubmit(onFormSubmit)}>
						<Form {...form}>
							<div className={"flex flex-col gap-6"}>
								<Card>
									<CardHeader className="text-center">
										<CardTitle className="text-xl">
											<h1>Welcome!</h1>
										</CardTitle>
										<CardDescription>
											<h2>Login with your Google account</h2>
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex *:flex-1 gap-2 sm:flex-row flex-col">
											<Button
												variant="outline"
												type="button"
												className="w-full"
												onClick={handleGoogleLogin}
												disabled={isSubmitting}
											>
												<GoogleIcon />
												Login with Google
											</Button>
										</div>
										<div className="relative my-4 flex items-center justify-center overflow-hidden">
											<Separator />
											<div className="px-2 text-center bg-card text-sm">OR</div>
											<Separator />
										</div>
										<div className="flex flex-col gap-4 my-4">
											<FormField
												control={control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel htmlFor="email">Email</FormLabel>
														<FormControl>
															<div className="relative">
																<MailIcon
																	className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
																	width={18}
																/>
																<Input
																	placeholder="user@email.com"
																	className="w-full px-8"
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
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel htmlFor="password">Password</FormLabel>
														<FormControl>
															<div className="flex flex-col gap-1">
																<div className="relative">
																	<LockIcon
																		className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
																		width={18}
																	/>
																	<Input
																		type={
																			showPassword ? "text" : "password"
																		}
																		placeholder="Password"
																		className="w-full px-8"
																		{...field}
																	/>
																	<button
																		onClick={togglePasswordVisibility}
																		type="button"
																		className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
																	>
																		{showPassword ? (
																			<EyeOffIcon className="h-5 w-5 text-muted-foreground" />
																		) : (
																			<EyeIcon className="h-5 w-5 text-muted-foreground" />
																		)}
																	</button>
																</div>
																<Link
																	to="/forgot-password"
																	viewTransition
																	prefetch="intent"
																	className="ml-auto text-sm underline-offset-4 hover:underline"
																>
																	Forgot your password?
																</Link>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<Button type="submit" className="w-full" disabled={isSubmitting}>
											{isSubmitting && <Loader2 className="animate-spin" />}
											<span>Login</span>
										</Button>
										<div className="flex justify-center gap-1 items-center">
											<p className="text-sm mt-2">Don&apos;t have an account?</p>
											<Link
												to="/signup"
												viewTransition
												prefetch="intent"
												className="text-sm underline-offset-4 hover:underline mt-2"
											>
												Signup
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

export default LoginPage;
