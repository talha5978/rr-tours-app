import {
	type ActionFunctionArgs,
	Link,
	useActionData,
	useLocation,
	useNavigate,
	useNavigation,
	useRouteLoaderData,
	useSubmit,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TourDetailOption, TourDetailAvailability } from "@workspace/shared/types/tours";
import { GetTourDetails } from "@workspace/shared/types/tours";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Loader2 } from "lucide-react";
import { PhoneInput } from "~/components/Booking/phone-number-input";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { toast } from "sonner";
import { ApiError } from "@workspace/shared/utils/ApiError";
import {
	type CreateBookingInput,
	customerBookingSchema,
	CustomerInput,
} from "@workspace/shared/schemas/booking.schema";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import { GoogleReCaptcha, verifyRecaptcha } from "~/components/ReCaptcha/GoogleReCaptcha";
import { type loader as rootLoader } from "~/root";
import { CheckoutService } from "@workspace/shared/services/checkout.service";
// import { emailService } from "@workspace/shared/services/emails.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	let clientSecret: string | null = null;
	try {
		if (request.method !== "POST") {
			throw new ApiError("Invalid request method", 405, []);
		}

		const rawBody = await request.json();

		const recaptchaToken = rawBody["recaptchaToken"] as string;

		if (!recaptchaToken || recaptchaToken == "") {
			return {
				success: false,
				error: "Captcha identification failed",
			};
		}

		const captchaResult = await verifyRecaptcha(recaptchaToken);

		if (!captchaResult.success) {
			return {
				success: false,
				error: "Captcha verification failed",
			};
		}

		const checkoutSvc = new CheckoutService(request);
		const { bookingRef, clientSecret, error, success } = await checkoutSvc.confirmCheckout(rawBody);

		if (!success || error) {
			return {
				success: false,
				booking_ref: null,
				clientSecret,
				error:
					error instanceof ApiError ? error.message : error.message || "Failed to create booking",
			};
		}

		const cacheSvc = new CacheInvalidationService(request);
		await cacheSvc.pushCacheInvalidationEvent({
			target: "admin",
			keys: [`high_level_bookings`, "dashboard_main_stats"],
		});

		// await emailService.sendSoftBookingCreationEmail({ ...rawBody, booking_ref });

		return { success, booking_ref: bookingRef, clientSecret };
	} catch (error: any) {
		return {
			success: false,
			booking_ref: null,
			clientSecret,
			error: error instanceof ApiError ? error.message : error.message || "Failed to create booking",
		};
	}
};

export const loader = () => {
	return null;
};

async function getCheckoutSession(body: any) {
	console.log("Creating CHECKOUT SESSION...");

	const res = await fetch("/get-stripe-checkout-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	const data: { sessionId: string | null; url: string | null; error: any } = await res.json();
	console.log("Checkout session response:", data);

	if (data.error) {
		toast.error(data.error.message || "Failed to create payment page");
		return;
	}

	if (data.url) {
		window.location.href = data.url;
	} else {
		toast.error("No payment URL received from Stripe", {
			description: "Please try again or contact support",
		});
	}
}

export default function BookingPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const submit = useSubmit();
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");

	// @ts-ignore
	const actionData: ActionResponse & {
		booking_ref: string | null;
		clientSecret?: string | null;
	} = useActionData();

	const {
		tour,
		option,
		date,
		timeSlot,
		quantities,
	}: {
		tour: GetTourDetails;
		option: TourDetailOption;
		date: Date;
		timeSlot: TourDetailAvailability["time_slots"][0];
		quantities: Record<number, number>;
	} = location.state || {};

	const form = useForm<CustomerInput>({
		resolver: zodResolver(customerBookingSchema),
		defaultValues: {
			customer_email: rootLoaderData?.user?.email ?? "",
			customer_name:
				rootLoaderData?.user?.first_name && rootLoaderData?.user?.first_name
					? rootLoaderData?.user?.first_name + " " + rootLoaderData?.user?.last_name
					: "",
			customer_phone: rootLoaderData?.user?.phone_number ?? "",
		},
	});

	const { handleSubmit, control, setError, reset } = form;
	const recaptchaRef = useRef(null);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	const subtotal = useMemo(() => {
		if (!option || !quantities) {
			return 0;
		}

		return Object.entries(quantities).reduce((sum, [typeId, qty]) => {
			const price = option.prices.find((p) => p.participant_type.id === Number(typeId))?.price || 0;
			return sum + price * (qty || 0);
		}, 0);
	}, [quantities, option]);

	const discount = 0; // Default, as no calculation logic provided
	const taxes = 0; // Default
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

				getCheckoutSession({
					amount: total,
					bookingRef: actionData?.booking_ref,
					tour_name: tour.name,
					tour_cover_img_url: SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image,
					description: "Payment for tour: " + tour.name + " for " + option.name,
					successUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${actionData?.booking_ref}/payment-success?tour=${tour.name}`,
					cancelUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${actionData?.booking_ref}/payment-cancel?tour=${tour.name}`,
				});
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
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CustomerInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	if (!tour || !option || !date || !timeSlot || !quantities) {
		return (
			<div className="py-40">
				<p className="text-muted-foreground text-center">
					Missing booking data. Please go back and select your preferences.
				</p>
			</div>
		);
	}

	const onSubmit = async (data: CustomerInput) => {
		if (!tour || !option || !date || !timeSlot || !quantities) {
			toast.error("Missing booking data. Please go back and select your preferences.");
			return;
		}

		let payload: CreateBookingInput & { recaptchaToken: string; added_by: string | null } = {
			customer_name: data.customer_name.trim(),
			customer_email: data.customer_email.trim(),
			customer_phone: data.customer_phone.trim(),
			tour_id: tour.id,
			tour_name: tour.name,
			tour_option_id: option.id,
			tour_option_name: option.name,
			date: format(date, "yyyy-MM-dd"),
			timeslot: timeSlot.label,
			isOpenDated: option.isOpenDated,
			participants: Object.entries(quantities)
				.filter(([, qty]) => qty > 0)
				.map(([typeId, qty]) => ({
					participant_name:
						tour.tour_options
							.find((opt) => opt.id === option.id)
							?.prices.find((p) => p.participant_type.id === Number(typeId))
							?.participant_type.name.trim() || 0,
					participant_type_id: Number(typeId),
					quantity: qty,
					unit_price:
						option.prices.find((p) => p.participant_type.id === Number(typeId))?.price || 0,
				})),
			subtotal,
			discount,
			taxes,
			total,
			recaptchaToken: recaptchaToken ?? "",
			added_by: rootLoaderData?.user?.id ?? null,
		};

		submit(payload, {
			method: "POST",
			action: "/booking",
			encType: "application/json",
			state: location.state,
			replace: true,
		});
	};

	return (
		<>
			<MetaDetails
				metaTitle={`Complete your booking | ${tour.name} | WanderNest`}
				metaDescription={"Tour Booking Page"}
				metaKeywords="Booking"
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image}
				hasPricing
				pricing={{
					price: total.toString(),
				}}
				ogType="article"
			/>
			<div className="space-y-8">
				<h1 className="text-2xl md:text-3xl font-bold">Complete Your Booking!</h1>

				{!rootLoaderData?.user && (
					<Card className="border-warning bg-warning/30">
						<CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div>
								<p className="font-medium">Not signed in yet?</p>
								<p className="text-sm text-muted-foreground">
									Sign in to view this booking in your account and track it easily later.
								</p>
							</div>
							<div className="flex gap-3 shrink-0">
								<Link to="/login" state={{ from: location.pathname }} viewTransition>
									<Button variant="outline" size="sm">
										Sign in
									</Button>
								</Link>
								<Link to="/signup" state={{ from: location.pathname }} viewTransition>
									<Button size="sm">Sign up</Button>
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
								later after we will contact you.
							</CardDescription>
						</CardHeader>
						<Separator />
						<CardContent className="space-y-2">
							<div className="booking-page-row">
								<h3>Tour</h3>
								<span className="font-semibold">{tour.name}</span>
							</div>
							<div className="booking-page-row">
								<h3>Option</h3>
								<span className="font-semibold">{option.name}</span>
							</div>
							<div className="booking-page-row">
								<h3>Date</h3>
								<span>{format(date, "PPPP")}</span>
							</div>
							<div className="booking-page-row">
								<h3>Time Slot</h3>
								<span>{timeSlot.label}</span>
							</div>
						</CardContent>
						<Separator />
						<CardContent className="space-y-2">
							<h3 className="font-semibold">Participants:</h3>
							{Object.entries(quantities)
								.filter(([, qty]) => qty > 0)
								.map(([typeId, qty]) => {
									const pt = option.prices.find(
										(p) => p.participant_type.id === Number(typeId),
									)?.participant_type;
									const price =
										option.prices.find((p) => p.participant_type.id === Number(typeId))
											?.price || 0;
									return (
										<div key={typeId} className="booking-page-row">
											<div>
												<div>
													{pt?.name} (x{qty})
												</div>
												<div className="text-xs">
													{pt?.age_max && pt?.age_min ? (
														pt.age_max - pt.age_min > 80 ? (
															<p>({pt.age_min}+)</p>
														) : pt.age_max === 0 && pt.age_min === 0 ? (
															<></>
														) : (
															<p>
																({pt.age_min}-{pt.age_max})
															</p>
														)
													) : null}
												</div>
											</div>
											<span>{(price * qty).toFixed(2)} AED</span>
										</div>
									);
								})}
						</CardContent>
						<Separator />
						<CardContent className="space-y-2">
							<div className="booking-page-row">
								<h3>Subtotal</h3>
								<span>{subtotal.toFixed(2)} AED</span>
							</div>
							<div className="booking-page-row">
								<h3>Discount</h3>
								<span>{discount.toFixed(2)} AED</span>
							</div>
							<div className="booking-page-row">
								<h3>Taxes</h3>
								<span>{taxes.toFixed(2)} AED</span>
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
