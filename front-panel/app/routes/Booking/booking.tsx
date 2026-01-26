import {
	type ActionFunctionArgs,
	Link,
	useActionData,
	useLocation,
	useNavigate,
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
import { useEffect, useMemo, useState } from "react";
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
import { BookingService } from "@workspace/shared/services/booking.service";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		// return { success: true, booking_ref: "HELLO234" }
		if (request.method !== "POST") {
			throw new ApiError("Invalid request method", 405, []);
		}

		const rawBody = await request.json();
		// console.log(rawBody);

		const svc = new BookingService(request);
		const booking_ref = await svc.createBooking(rawBody);

		const cacheSvc = new CacheInvalidationService(request);
		await cacheSvc.pushCacheInvalidationEvent({
			target: "admin",
			keys: [`high_level_bookings`, "dashboard_main_stats"],
		});

		return { success: true, booking_ref };
	} catch (error: any) {
		return {
			success: false,
			booking_ref: null,
			error: error instanceof ApiError ? error.message : error.message || "Failed to create booking",
		};
	}
};

export const loader = () => {
	return null;
};

export default function BookingPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const submit = useSubmit();
	const [bookingRef, setBookingRef] = useState("");

	// @ts-ignore
	const actionData: ActionResponse & { booking_ref: string | null } = useActionData();

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
			customer_email: "",
			customer_name: "",
			customer_phone: "",
		},
	});

	const { handleSubmit, control, setError } = form;

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
			console.log(actionData);

			if (actionData.success) {
				toast.success("Booking created successfully!", {
					description: "You can track your booking using the provided reference ID.",
				});

				if (actionData.booking_ref) {
					setBookingRef(actionData.booking_ref);
				}
			} else if (actionData.error) {
				toast.error(actionData.error);
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

		let payload: CreateBookingInput = {
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
					participant_type_id: Number(typeId),
					quantity: qty,
					unit_price:
						option.prices.find((p) => p.participant_type.id === Number(typeId))?.price || 0,
				})),
			subtotal,
			discount,
			taxes,
			total,
		};

		submit(payload, {
			method: "POST",
			action: "/booking",
			encType: "application/json",
			state: location.state,
			replace: true,
		});
	};

	if (bookingRef) {
		return (
			<>
				<MetaDetails
					metaTitle={`Booking Pending | ${tour.name} | Top Attractions Dubai`}
					metaDescription={`Your booking has been created and is pending confirmation. Admins will contact you shortly. You can track your booking using the provided reference ID.`}
					ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image}
					ogType="article"
				/>
				<section className="space-y-4 flex flex-col items-center justify-center py-20 ">
					<div className="bg-card w-fit flex flex-col items-center justify-center p-6 gap-4 border shadow-xs hover:shadow-lg transition duration-200 ease-in-out rounded-lg max-w-lg">
						<h1 className="section-heading text-center">Booking Confirmation</h1>
						<p className="text-center">
							Your booking has been created and is pending confirmation. Admins will contact you
							shortly.
						</p>
						<div className="bg-accent p-4 w-full rounded-lg">
							<p className="font-semibold">Booking Reference ID: {bookingRef}</p>
							<p>Use this ID to track your booking.</p>
						</div>
						<Link to="/track-booking" viewTransition>
							<Button type="button">Track Booking</Button>
						</Link>
					</div>
				</section>
			</>
		);
	}

	return (
		<>
			<MetaDetails
				metaTitle={`Complete your booking | ${tour.name} | Top Attractions Dubai`}
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

									<div className="w-fit ml-auto">
										<Button type="submit" disabled={isSubmitting}>
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
