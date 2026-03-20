import {
	type ActionFunctionArgs,
	Link,
	useActionData,
	useLoaderData,
	useNavigation,
	useSubmit,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { AlertTriangle, Loader2 } from "lucide-react";
import { PhoneInput } from "~/components/Booking/phone-number-input";
import { toast } from "sonner";
import {
	type CreateBookingFromCartInput,
	customerBookingSchema,
	CustomerInput,
} from "@workspace/shared/schemas/booking.schema";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import { GoogleReCaptcha, verifyRecaptcha } from "~/components/ReCaptcha/GoogleReCaptcha";
import { CheckoutService } from "@workspace/shared/services/checkout.service";
import { queryClient } from "@workspace/shared/utils/query-client";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentUserQuery } from "@workspace/shared/queries/auth.q";
import { myCartQuery } from "~/queries/cart.q";
// import { emailService } from "@workspace/shared/services/emails.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const rawBody = await request.json();

		const recaptchaToken = rawBody["recaptchaToken"] as string;

		if (!recaptchaToken) {
			return { success: false, error: "Captcha identification failed" };
		}

		const captchaResult = await verifyRecaptcha(recaptchaToken);
		if (!captchaResult.success) {
			return { success: false, error: "Captcha verification failed" };
		}

		const checkoutSvc = new CheckoutService(request);
		const result = await checkoutSvc.confirmCheckout(rawBody);
		console.log("Confrim checkout result", result);

		if (!result.success) {
			return {
				success: false,
				booking_ref: null,
				clientSecret: null,
				error: result.error?.message || "Failed to create booking",
			};
		}

		await queryClient.invalidateQueries({ queryKey: ["my_bookings"] });

		const cacheSvc = new CacheInvalidationService(request);
		await cacheSvc.pushCacheInvalidationEvent({
			target: "admin",
			keys: ["high_level_bookings", "dashboard_main_stats"],
		});

		// await emailService.sendSoftBookingCreationEmail({ ...rawBody, booking_ref });

		return {
			success: true,
			booking_ref: result.bookingRef,
			clientSecret: result.clientSecret,
		};
	} catch (error: any) {
		console.error(error);

		return {
			success: false,
			booking_ref: null,
			clientSecret: null,
			error: error.message || "Failed to create booking",
		};
	}
};

export const loader = async ({ request }: { request: Request }) => {
	const { authId, headers } = genAuthSecurity(request);
	const userData = await queryClient.fetchQuery(currentUserQuery({ request, authId, headers }));

	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;

	let myCart = null;

	if (userData && userData.user) {
		myCart = await queryClient.fetchQuery(
			myCartQuery({ request, user_id: userData.user?.id, page, limit: 30 }),
		);
	}

	// console.log(myCart);

	return { myCart, userData };
};

async function getCheckoutSession(bookingRef: string, cartItems: any[], customer_email: string) {
	console.log("Creating CHECKOUT SESSION for booking:", bookingRef);

	const res = await fetch("/get-stripe-checkout-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			bookingRef,
			cartItems,
			successUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${bookingRef}/payment-success`,
			cancelUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${bookingRef}/payment-cancel`,
			customer_email,
		}),
	});

	const data: { sessionId: string | null; url: string | null; error: any } = await res.json();

	if (data.error) {
		toast.error(data.error.message || "Failed to create payment page");
		return;
	}

	if (data.url) {
		window.location.href = data.url;
	} else {
		toast.error("No payment URL received from Stripe");
	}
}

export default function BookingPage() {
	const {
		myCart,
		userData: { user },
	} = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const submit = useSubmit();
	const actionData = useActionData() as any;

	const form = useForm<CustomerInput>({
		resolver: zodResolver(customerBookingSchema),
		defaultValues: {
			customer_email: user?.email ?? "",
			customer_name: user ? `${user.first_name} ${user.last_name}` : "",
			customer_phone: user?.phone_number ?? "",
		},
	});

	const { handleSubmit, reset, control } = form;

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
	const recaptchaRef = useRef(null);

	const subtotal =
		myCart?.items?.reduce((sum, item) => {
			return sum + item.quantities.reduce((acc, q) => acc + q.quantity * q.price, 0);
		}, 0) ?? 0;

	let discount = 0;
	let taxes = 0;

	const total = subtotal - discount + taxes;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Booking created successfully!", {
					description: "Initiating payment process.",
				});

				setRecaptchaToken(null);
				reset();
				if (recaptchaRef.current !== null) {
					// @ts-ignore
					recaptchaRef.current.reset();
				}

				const cartLineItems =
					myCart?.items.flatMap((item) =>
						item.quantities.map((q) => ({
							tour_name: `${item.tour_name} - ${item.tour_option_name}`,
							option_name: `${q.participant_type_name} × ${q.quantity}`,
							price: q.price, // Unit price
							quantity: q.quantity, // Actual Number of Participants
						})),
					) ?? [];

				getCheckoutSession(actionData.booking_ref, cartLineItems, user?.email ?? "");
			} else if (actionData.error) {
				toast.error(actionData.error);
				setRecaptchaToken(null);
				reset();
				if (recaptchaRef.current !== null) {
					// @ts-ignore
					recaptchaRef.current.reset();
				}
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
			}
		}
	}, [actionData]);

	if (!myCart || !myCart.success || myCart.error || myCart.items.length === 0) {
		return (
			<>
				<MetaDetails
					metaTitle="Missing Booking Data"
					metaDescription="Missing booking data. Please go back and select your preferences."
				/>
				<div className="py-40 flex items-center justify-center">
					<div className="flex gap-2 flex-col p-6 bg-destructive/10 border-2 border-destructive rounded-md w-fit">
						<AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
						<p className="text-destructive text-center">
							Missing booking data. Please go back and select your preferences.
						</p>
					</div>
				</div>
			</>
		);
	}

	const onSubmit = async (data: CustomerInput) => {
		if (!myCart?.success || !myCart.cart_id) {
			toast.error("Cart is empty or not found. Please add tours first.");
			return;
		}

		if (!recaptchaToken) {
			toast.error("Please complete the CAPTCHA verification.");
			return;
		}

		if (!user) {
			toast.error("Please sign in to complete your booking.");
			return;
		}

		const payload: CreateBookingFromCartInput = {
			customer_name: data.customer_name.trim(),
			customer_email: data.customer_email.trim(),
			customer_phone: data.customer_phone.trim(),
			cart_id: myCart.cart_id,
			recaptchaToken: recaptchaToken,
			added_by: user?.id ?? null,
		};

		submit(payload, {
			method: "POST",
			encType: "application/json",
			replace: true,
		});
	};

	return (
		<>
			<MetaDetails
				metaTitle={`Complete your booking | WanderNest`}
				metaDescription={"Tour Booking Page"}
				metaKeywords="Booking"
				hasPricing
				pricing={{
					price: total.toString(),
				}}
				ogType="article"
			/>
			<div className="space-y-8">
				<h1 className="text-2xl md:text-3xl font-bold">Complete Your Booking!</h1>
				{!user && (
					<Card className="border-warning bg-warning/30">
						<CardContent className="flex justify-between items-center">
							<div>
								<p className="font-medium">Not signed in?</p>
								<p className="text-sm text-muted-foreground">
									Sign in to track this booking easily.
								</p>
							</div>
							<div className="flex gap-3">
								<Link viewTransition to="/login">
									<Button variant="outline" size="sm">
										Sign In
									</Button>
								</Link>
								<Link viewTransition to="/signup">
									<Button size="sm">Sign Up</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				)}
				<div className="w-full md:*:w-full *:h-fit flex md:flex-row flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle>
								<h2>Customer Details</h2>
							</CardTitle>
							<CardDescription>
								Please enter your correct details. You will be contacted by the tour operator.
							</CardDescription>
						</CardHeader>
						<Separator />
						<CardContent>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<Form {...form}>
									<FormField
										control={control}
										name="customer_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Full Name</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter your full name"
														spellCheck={false}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={control}
										name="customer_email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter your email"
														spellCheck={false}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={control}
										name="customer_phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone Number</FormLabel>
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

									<GoogleReCaptcha
										siteKey={process.env.VITE_RECAPTCHA_SITE_KEY as string}
										onChange={(token) => setRecaptchaToken(token)}
										ref={recaptchaRef}
									/>

									<div className="w-fit ml-auto mt-6">
										<Button type="submit" disabled={isSubmitting || !recaptchaToken}>
											{isSubmitting && <Loader2 className="animate-spin" />}
											{isSubmitting ? "Submitting" : "Confirm Booking"}
										</Button>
									</div>
								</Form>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>
								<h2>Booking Summary</h2>
							</CardTitle>
							<CardDescription>
								Please note that these details specifically date and timeslots can be changed
								later.
							</CardDescription>
						</CardHeader>
						<Separator />
						<CardContent className="space-y-2">
							{myCart.items.map((item) => (
								<div key={item.cart_item_id} className="border rounded-lg p-4">
									<div className="font-semibold">{item.tour_name}</div>
									<div className="text-sm text-muted-foreground">
										{item.tour_option_name}
									</div>
									<div className="text-xs mt-1">
										{format(new Date(item.preferred_date!), "PPPP")} •{" "}
										{item.preferred_timeslot}
									</div>

									<div className="mt-3 text-xs">
										<table className="w-full text-center">
											<tr className="*:bg-muted-foreground *:text-white *:border *:p-1">
												<th>Participants</th>
												<th>Quantity</th>
												<th>Unit Price</th>
												<th>Total Price</th>
											</tr>

											{item.quantities.map((q) => (
												<tr key={q.participant_type_id} className="*:border *:p-1">
													<td>
														{q.participant_type_name} ({q.participant_age_group})
													</td>
													<td>{q.quantity}</td>
													<td>AED {q.price.toFixed(2)}</td>
													<td>AED {(q.price * q.quantity).toFixed(2)}</td>
												</tr>
											))}
										</table>
									</div>

									<div className="mt-3 flex items-end">
										<span className="w-fit font-lg ml-auto">
											AED{" "}
											{item.quantities
												.reduce((acc, q) => acc + q.price * q.quantity, 0)
												.toFixed(2)}
										</span>
									</div>
								</div>
							))}
						</CardContent>
						<Separator />
						<CardContent className="space-y-2">
							<div className="booking-page-row">
								<h3>Discount</h3>
								<span>{discount.toFixed(2)} AED</span>
							</div>
							<div className="booking-page-row">
								<h3>Taxes/Fees</h3>
								<span>{taxes.toFixed(2)} AED</span>
							</div>
							<div className="booking-page-row">
								<h3>Subtotal</h3>
								<span>{subtotal.toFixed(2)} AED</span>
							</div>
							<div className="booking-page-row font-semibold">
								<h3>Total</h3>
								<span>{total.toFixed(2)} AED</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
