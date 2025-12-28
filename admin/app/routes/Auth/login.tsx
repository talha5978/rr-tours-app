import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	ActionFunctionArgs,
	Link,
	LoaderFunctionArgs,
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
// import { currentUserQuery } from "@workspace/shared/queries/auth.q";
import { type onlyEmailLoginFormData, onlyEmailLoginSchema } from "@workspace/shared/schemas/login.schema";
import { type OtpFormData, OtpSchema } from "@workspace/shared/schemas/otp.schema";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { extractAuthId } from "@workspace/shared/utils/auth-utils.server";
import { queryClient } from "@workspace/shared/utils/query-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "~/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Mail } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { currentUserQuery } from "@workspace/shared/queries/auth.q";

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	try {
		const intent = formData.get("intent") as string;

		if (intent === "verify") {
			const email = formData.get("email") as string;
			const token = formData.get("token") as string;

			const parseResult = OtpSchema.safeParse({ email, token });

			if (!parseResult.success) {
				return {
					success: false,
					intent: "verify",
					validationErrors: parseResult.error.flatten().fieldErrors,
				};
			}

			const authSvc = new AuthService(request);
			const { error: tokenError, headers } = await authSvc.verifyOtp({ email, token });

			if (tokenError) {
				return {
					success: false,
					intent: "verify",
					error: tokenError.message || "Failed to verify OTP",
				};
			}

			// const { user, error: userErr } = await authSvc.getCurrentUser();

			// if (userErr || !user) {
			// 	return { success: false, intent: "verify", error: "Failed to fetch user session" };
			// }

			return new Response(JSON.stringify({ success: true, intent: "verify" }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": headers.get("Set-Cookie") || "",
				},
			});
		} else {
			const email = (formData.get("email") as string)?.trim();

			const parseResult = onlyEmailLoginSchema.safeParse({ email });
			if (!parseResult.success) {
				const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
				return { success: false, intent: "send", error: firstError };
			}

			const authSvc = new AuthService(request);
			const { error, headers } = await authSvc.getCode({ email });

			if (error) {
				return { success: false, intent: "send", error: error.message || "Failed to send code" };
			}

			return new Response(JSON.stringify({ success: true, intent: "send", email }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": headers.get("Set-Cookie") || "",
				},
			});
		}
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to process request";
		return {
			success: false,
			intent: formData.get("intent") as string,
			error: errorMessage,
		};
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const authId = extractAuthId(request);
	
	if (authId) {
		const resp = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
		if (resp?.user?.id) return redirect("/");
	}

	return { user: null };
}

type LoginActionData =
	| (ActionResponse & { email?: string; intent?: string; validationErrors?: any })
	| undefined;

function Login() {
	const actionData: LoginActionData = useActionData();

	const submit = useSubmit();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const [tabValue, setTabValue] = useState("login");
	const [email, setEmail] = useState("");

	const isSending = navigation.state === "submitting" && navigation.formData?.get("intent") === "send";
	const isVerifying = navigation.state === "submitting" && navigation.formData?.get("intent") === "verify";

	const emailForm = useForm<onlyEmailLoginFormData>({
		resolver: zodResolver(onlyEmailLoginSchema),
		mode: "onChange",
	});

	const otpForm = useForm<OtpFormData>({
		resolver: zodResolver(OtpSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			token: "",
		},
	});

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				if (actionData.intent === "send" && actionData.email) {
					toast.success("OTP sent successfully to your email");
					setEmail(actionData.email);
					setTabValue("otp");
					otpForm.setValue("email", actionData.email);
				} else if (actionData.intent === "verify") {
					toast.success("Logged in successfully");
					queryClient.invalidateQueries({ queryKey: ["current_user"] });
					navigate("/", { replace: true });
				}
			} else {
				if (actionData.intent === "send") {
					toast.error(actionData.error || "Failed to send OTP");
				} else if (actionData.intent === "verify") {
					toast.error(actionData.error || "Failed to verify OTP");
					otpForm.setError("token", { message: actionData.error });
				}
				if (actionData.validationErrors) {
					Object.entries(actionData.validationErrors).forEach(([field, errors]: [any, any]) => {
						if (actionData.intent === "	") {
							otpForm.setError(field as keyof OtpFormData, { message: errors[0] });
						} else {
							emailForm.setError(field as keyof onlyEmailLoginFormData, { message: errors[0] });
						}
					});
				}
			}
		}
	}, [actionData, navigate, otpForm, emailForm]);

	useEffect(() => {
		if (email) {
			otpForm.setValue("email", email);
		}
	}, [email, otpForm]);

	const onOtpSubmit = (data: OtpFormData) => {
		const formData = new FormData();
		formData.append("intent", "verify");
		formData.append("email", data.email);
		formData.append("token", data.token);
		submit(formData, { method: "post", action: "/login" });
	};

	return (
		<section className="flex w-full h-svh items-center py-4 px-4">
			<div className="flex flex-col gap-6 max-w-md mx-auto">
				<Card className="w-full max-w-md pb-8 relative">
					<div className="absolute top-4 right-4">
						<Badge>Admin Panel</Badge>
					</div>
					<Tabs
						value={tabValue}
						onValueChange={setTabValue}
						className="*:data-[slot=tabs-content]:mt-4"
					>
						<CardHeader>
							<div>
								<h2 className="text-2xl font-bold mx-auto w-fit mt-2 mb-4">Login</h2>
							</div>
							<TabsList className="w-full">
								<TabsTrigger value="login">Login</TabsTrigger>
								<TabsTrigger value="otp">Verify</TabsTrigger>
							</TabsList>
						</CardHeader>
						<TabsContent value="login">
							<CardContent>
								<Form {...emailForm}>
									<form
										method="POST"
										className="space-y-4"
										onSubmit={emailForm.handleSubmit((data) => {
											const formData = new FormData();
											formData.append("intent", "send");
											formData.append("email", data.email);
											submit(formData, { method: "post", action: "/login" });
										})}
									>
										<FormField
											control={emailForm.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Enter Email</FormLabel>
													<FormControl>
														<Input placeholder="admin@gmail.com" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type="submit" className="w-full" disabled={isSending}>
											{isSending && <Loader2 className="animate-spin mr-1" />}
											<span>Get OTP</span>
										</Button>
									</form>
								</Form>
							</CardContent>
						</TabsContent>
						<TabsContent value="otp">
							<CardContent>
								<Form {...otpForm}>
									<form className="space-y-4" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
										<input type="hidden" name="email" value={email} />
										<FormField
											control={otpForm.control}
											name="token"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Enter OTP</FormLabel>
													<FormControl>
														<InputOTP maxLength={8} {...field}>
															<InputOTPGroup className="w-full *:w-full">
																<InputOTPSlot index={0} />
																<InputOTPSlot index={1} />
																<InputOTPSlot index={2} />
																<InputOTPSlot index={3} />
																{/* </InputOTPGroup>
															<InputOTPSeparator />
															<InputOTPGroup className="w-full *:w-full"> */}
																<InputOTPSlot index={4} />
																<InputOTPSlot index={5} />
																<InputOTPSlot index={6} />
																<InputOTPSlot index={7} />
															</InputOTPGroup>
														</InputOTP>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type="submit" className="w-full" disabled={isVerifying}>
											{isVerifying && <Loader2 className="animate-spin mr-1" />}
											<span>Verify OTP</span>
										</Button>
									</form>
								</Form>
								<Alert variant="default" className="mt-4">
									<Mail className="h-4 w-4" />
									<AlertTitle>Note</AlertTitle>
									<AlertDescription>Please enter the code sent to {email}</AlertDescription>
								</Alert>
								<div className="text-center text-sm text-muted-foreground my-2 flex items-center">
									<p>Didn’t receive a code?</p>
									<Button variant="link" onClick={() => setTabValue("login")}>
										Resend
									</Button>
								</div>
							</CardContent>
						</TabsContent>
					</Tabs>
				</Card>
				<div className="text-center text-sm text-muted-foreground">
					By clicking “{tabValue == "login" ? "Get" : "Verify"} OTP,” you agree to our
					<Link to="#" className="underline ml-1">
						Terms of Service
					</Link>{" "}
					and
					<Link to="#" className="underline ml-1">
						Privacy Policy
					</Link>
					.
				</div>
			</div>
		</section>
	);
}

export default Login;
