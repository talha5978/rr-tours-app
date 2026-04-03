import { zodResolver } from "@hookform/resolvers/zod";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants/constants";
import {
	type UpdateBookingActionData,
	type UpdateBookingInput,
	UpdateBookingSchema,
} from "@workspace/shared/schemas/booking.schema";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { getBookingDetailById } from "~/queries/bookings.q";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/Custom-Inputs/phone-number-input";
import { format } from "date-fns";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { BookingService } from "@workspace/shared/services/booking.service";
import DatePicker from "~/components/Custom-Inputs/date-picker";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = params.id as string;
	if (!id) throw new Response("Booking ID is required", { status: 400 });

	const ref = params.ref as string;
	if (!ref) throw new Response("Booking ref is required", { status: 400 });

	const formData = await request.formData();

	const booking: UpdateBookingActionData = {};

	if (formData.has("payload") && formData.get("payload") !== "") {
		const rawPayload = JSON.parse(formData.get("payload") as string);
		if (rawPayload.admin_note !== undefined) booking.admin_note = rawPayload.admin_note;
		if (rawPayload.booking_status) booking.booking_status = rawPayload.booking_status;
		if (rawPayload.payment_status) booking.payment_status = rawPayload.payment_status;

		if (rawPayload.customer_name) booking.customer_name = rawPayload.customer_name;
		if (rawPayload.customer_email) booking.customer_email = rawPayload.customer_email;
		if (rawPayload.customer_phone) booking.customer_phone = rawPayload.customer_phone;
		if (rawPayload.discount != undefined) booking.discount = rawPayload.discount;
		if (rawPayload.taxes != undefined) booking.taxes = rawPayload.taxes;
		if (rawPayload.participants_unit_prices && rawPayload.participants_unit_prices.length > 0)
			booking.participants_unit_prices = rawPayload.participants_unit_prices;
		if (rawPayload.item_dates && rawPayload.item_dates.length > 0) {
			booking.item_dates = rawPayload.item_dates;
		}
	}

	const svc = new BookingService(request);

	try {
		await svc.updateBooking(id, booking);

		await cacheService.invalidatePattern(CACHE_KEYS.bookings.highLevel() + ":*");
		await cacheService.invalidate(CACHE_KEYS.bookings.details("AD", id));
		await cacheService.invalidate(CACHE_KEYS.bookings.forConfirmation(id));
		await cacheService.invalidate(CACHE_KEYS.dashboard.mainStats());
		await cacheService.invalidate(CACHE_KEYS.dashboard.mainChartData());
		await cacheService.invalidate(CACHE_KEYS.bookings.details("FP", ref));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update booking",
		};
	} finally {
		const bookingData = await getBookingDetailById({ request, id });
		if (bookingData.booking?.added_by) {
			cacheService.invalidatePattern(
				CACHE_KEYS.bookings.user_bookings(bookingData.booking?.added_by) + ":*",
			);
		}
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) {
		throw new Response("Booking ID is required", { status: 400 });
	}

	const ref = params.ref as string;
	if (!ref) {
		throw new Response("Booking reference ID is required", { status: 400 });
	}

	const response = await getBookingDetailById({ request, id });
	// console.log(response?.booking);

	return response;
};

export default function UpdateBooking() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();
	const { booking, error } = useLoaderData<typeof loader>();
	const [changePricing, setChangePricing] = useState(false);

	if (error || !booking) {
		toast.error(`Error ${error?.statusCode || 500}`, {
			description: error?.message ?? "Something went wrong",
		});

		navigate("/bookings");
		return null;
	}

	const actionData: ActionResponse = useActionData();

	const form = useForm<UpdateBookingInput>({
		resolver: zodResolver(UpdateBookingSchema),
		mode: "onSubmit",
		disabled: !!booking.cancelled_at,
		defaultValues: {
			admin_note: booking.admin_note ?? "",
			booking_status: booking.booking_status,
			payment_status: booking.payment.payment_status,

			customer_name: booking.customer_name ?? "",
			customer_email: booking.customer_email ?? "",
			customer_phone: booking.customer_phone ?? "",

			taxes: booking.taxes.toString(),
			discount: booking.discount.toString(),

			participants_unit_prices: booking.booking_items.flatMap((item) =>
				item.booking_participants_new.map((p) => ({
					booking_participant_id: p.id,
					quantity: p.quantity,
					unit_price: p.unit_price,
				})),
			),

			item_dates: booking.booking_items.map((item) => ({
				booking_item_id: item.id,
				preffered_date: item.preffered_date ? new Date(item.preffered_date) : null,
				preffered_time: item.preffered_timeslot ?? "N/A",
				confirmed_date: item.confirmed_date ? new Date(item.confirmed_date) : null,
				confirmed_time: item.confirmed_timeslot ?? "N/A",
			})),
		},
	});

	const { handleSubmit, setError, control } = form;

	const { fields } = useFieldArray({
		control,
		name: "participants_unit_prices",
	});

	const { fields: dateFields } = useFieldArray({
		control,
		name: "item_dates",
	});

	const isSubmitting = navigation.state === "submitting";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success(`${booking.booking_ref} booking updated successfully`);
				navigate(`/bookings`, { replace: true, viewTransition: true });
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateBookingInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateBookingInput) {
		if (!booking) {
			toast.error("Booking not found. Please try again.");
			return;
		}

		const payload: UpdateBookingActionData = {};

		const hasChanged = (newVal: any, oldVal: any): boolean => {
			if (newVal instanceof Date && oldVal instanceof Date) {
				return newVal.getTime() !== oldVal.getTime();
			}
			if (newVal === null || newVal === undefined || newVal === "") {
				return oldVal !== null && oldVal !== undefined && oldVal !== "";
			}
			return newVal !== oldVal;
		};

		// Core fields
		if (hasChanged(values.booking_status, booking.booking_status)) {
			payload.booking_status = values.booking_status;
		}
		if (hasChanged(values.payment_status, booking.payment?.payment_status)) {
			payload.payment_status = values.payment_status;
		}
		if (hasChanged(values.customer_name?.trim(), booking.customer_name)) {
			payload.customer_name = values.customer_name?.trim() ?? null;
		}
		if (hasChanged(values.customer_email?.trim(), booking.customer_email)) {
			payload.customer_email = values.customer_email?.trim() ?? null;
		}
		if (hasChanged(values.customer_phone?.trim(), booking.customer_phone)) {
			payload.customer_phone = values.customer_phone?.trim() ?? null;
		}
		if (hasChanged(values.admin_note?.trim(), booking.admin_note)) {
			payload.admin_note = values.admin_note?.trim() ?? null;
		}
		if (hasChanged(Number(values.discount), booking.discount)) {
			payload.discount = Number(values.discount);
		}
		if (hasChanged(Number(values.taxes), booking.taxes)) {
			payload.taxes = Number(values.taxes);
		}

		// Dates & times (apply to first item for compatibility)
		if (values.item_dates && values.item_dates.length > 0) {
			// @ts-ignore
			payload.item_dates = values.item_dates.map((item, index) => {
				const originalItem = booking.booking_items[index];
				return {
					booking_item_id: item.booking_item_id,
					preffered_date:
						item.preffered_date == null
							? null
							: item.preffered_date instanceof Date
								? format(item.preffered_date, "yyyy-MM-dd")
								: originalItem.preffered_date,
					preffered_time: item.preffered_time,
					confirmed_date:
						item.confirmed_date == null
							? null
							: item.confirmed_date instanceof Date
								? format(item.confirmed_date, "yyyy-MM-dd")
								: originalItem.confirmed_date,
					confirmed_time: item.confirmed_time,
				};
			});
		}

		// Participants pricing changes
		const originalParticipants = booking.booking_items.flatMap((item) =>
			item.booking_participants_new.map((p) => ({
				booking_participant_id: p.id,
				quantity: p.quantity,
				unit_price: p.unit_price,
			})),
		);

		const changedParticipants = values.participants_unit_prices.filter((newP, index) => {
			const oldP = originalParticipants[index];
			if (!oldP) return true;
			return newP.quantity !== oldP.quantity || newP.unit_price !== oldP.unit_price;
		});

		if (changedParticipants.length > 0) {
			payload.participants_unit_prices = changedParticipants;
		}

		const formData = new FormData();
		formData.append("payload", JSON.stringify(payload));

		submit(formData, {
			method: "PATCH",
			action: `/bookings/${booking.id}/${booking.booking_ref}/update`,
			encType: "multipart/form-data",
		});
	}

	const watchedParticipants = useWatch({ control, name: "participants_unit_prices" }) ?? [];
	const watchedDiscount = Number(useWatch({ control, name: "discount" })) || 0;
	const watchedTaxes = Number(useWatch({ control, name: "taxes" })) || 0;

	const subtotal = watchedParticipants.reduce((sum, p) => {
		const qty = Number(p?.quantity) || 0;
		const price = Number(p?.unit_price) || 0;
		return sum + qty * price;
	}, 0);

	const total = subtotal - watchedDiscount + watchedTaxes;

	const formattedSubtotal = Number.isFinite(subtotal) ? subtotal.toFixed(2) : "0.00";
	const formattedTotal = Number.isFinite(total) ? total.toFixed(2) : "0.00";

	return (
		<>
			<MetaDetails
				metaTitle={booking?.booking_ref + " Booking | Admin Panel"}
				metaDescription="Update booking and view details"
				metaKeywords="Update Booking, booking"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/bookings" />
					<div className="flex gap-2 items-center flex-wrap">
						<h1 className="text-2xl font-semibold">Booking #{booking?.booking_ref}</h1>
					</div>
				</div>
				<form className="space-y-8" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<div className="grid lg:grid-cols-2 gap-6">
							{/* LEFT COLUMN – Core Info */}
							<Card className="h-fit">
								<CardHeader>
									<CardTitle>Core Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-8">
									{/* Status */}
									<div className="space-y-5">
										<h3 className="text-base font-medium">Booking & Payment Status</h3>
										<div className="grid gap-4 sm:grid-cols-2">
											<FormField
												control={control}
												name="booking_status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Booking Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{BOOKING_STATUS.map((status) => (
																	<SelectItem key={status} value={status}>
																		{status}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={control}
												name="payment_status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Payment Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{PAYMENT_STATUS.map((status) => (
																	<SelectItem key={status} value={status}>
																		{status}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>

									{/* Customer Info */}
									<div className="space-y-5">
										<h3 className="text-base font-medium">Customer Information</h3>
										<div className="grid gap-4">
											<FormField
												control={control}
												name="customer_name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Full Name</FormLabel>
														<FormControl>
															<Input {...field} />
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
															<Input type="email" {...field} />
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
															<PhoneInput {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* RIGHT COLUMN – Dates, Tours, Pricing, Note */}
							<Card className="h-fit">
								<CardHeader>
									<CardTitle>Dates & Pricing</CardTitle>
								</CardHeader>
								<CardContent className="space-y-8">
									{/* Booked Tours */}
									<div className="space-y-5">
										<h3 className="text-base font-medium">Tour Dates & Timeslots</h3>
										<div className="space-y-6">
											{dateFields.map((field, index) => {
												const item = booking.booking_items[index];
												return (
													<div key={field.id} className="border rounded-lg p-5">
														<h4 className="font-medium mb-3">
															{item.tour_name} — {item.tour_option_name}
														</h4>

														<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
															{/* Preferred */}
															<div className="space-y-4">
																<p className="text-sm font-medium text-muted-foreground">
																	Preferred
																</p>
																<FormField
																	control={control}
																	name={`item_dates.${index}.preffered_date`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>Date</FormLabel>
																			<FormControl>
																				<DatePicker
																					value={field.value}
																					onDateChange={
																						field.onChange
																					}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
																<FormField
																	control={control}
																	name={`item_dates.${index}.preffered_time`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>Timeslot</FormLabel>
																			<FormControl>
																				<Input
																					placeholder="e.g. 10:00 AM"
																					{...field}
																					value={field.value ?? ""}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															</div>

															{/* Confirmed */}
															<div className="space-y-4">
																<p className="text-sm font-medium text-muted-foreground">
																	Confirmed
																</p>
																<FormField
																	control={control}
																	name={`item_dates.${index}.confirmed_date`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>Date</FormLabel>
																			<FormControl>
																				<DatePicker
																					value={field.value}
																					onDateChange={
																						field.onChange
																					}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
																<FormField
																	control={control}
																	name={`item_dates.${index}.confirmed_time`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>Timeslot</FormLabel>
																			<FormControl>
																				<Input
																					placeholder="e.g. 10:00 AM"
																					{...field}
																					value={field.value ?? ""}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>

									{/* Participants Pricing */}
									<div className="space-y-5">
										<div className="flex justify-between items-center">
											<h3 className="text-base font-medium">Participants Pricing</h3>
											{!changePricing && (
												<Button
													size="sm"
													variant="destructive"
													onClick={() => setChangePricing(true)}
												>
													Edit Pricing
												</Button>
											)}
										</div>

										{changePricing ? (
											<div className="space-y-4">
												{fields.map((field, index) => {
													// Find original participant for display
													let participantName = "Unknown Participant";
													booking.booking_items.forEach((item) => {
														const p = item.booking_participants_new.find(
															(p) => p.id === field.booking_participant_id,
														);
														if (p) {
															let age = "";
															if (
																p.participant_type.age_max -
																	p.participant_type.age_min >
																80
															) {
																age = `(${p.participant_type.age_min}+)`;
															} else if (
																p.participant_type.age_max === 0 &&
																p.participant_type.age_min === 0
															) {
																age = "";
															} else {
																age = `(${p.participant_type.age_min}-${p.participant_type.age_max})`;
															}

															participantName =
																`${p.participant_type.name} ${age}` ||
																"Unknown Participant";
														}
													});

													return (
														<div key={field.id} className="border rounded-lg p-4">
															<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
																<div className="grid gap-2">
																	<Label>Type</Label>
																	<Input value={participantName} disabled />
																</div>
																<FormField
																	control={control}
																	name={`participants_unit_prices.${index}.quantity`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>Quantity</FormLabel>
																			<FormControl>
																				<Input
																					type="number"
																					min="1"
																					{...field}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
																<FormField
																	control={control}
																	name={`participants_unit_prices.${index}.unit_price`}
																	render={({ field }) => (
																		<FormItem>
																			<FormLabel>
																				Unit Price (AED)
																			</FormLabel>
																			<FormControl>
																				<Input
																					type="number"
																					step="0.01"
																					{...field}
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															</div>
														</div>
													);
												})}
											</div>
										) : (
											<div className="text-sm text-muted-foreground">
												Click "Edit Pricing" to modify participant quantities and
												prices.
											</div>
										)}
									</div>

									{/* Pricing Summary */}
									<div className="grid sm:grid-cols-2 gap-6">
										<FormField
											control={control}
											name="discount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Discount (AED)</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="taxes"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Taxes (AED)</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="grid gap-2">
											<Label>Subtotal (AED)</Label>
											<Input value={formattedSubtotal} disabled className="bg-muted" />
										</div>
										<div className="grid gap-2">
											<Label>Total (AED)</Label>
											<Input
												value={formattedTotal}
												disabled
												className="bg-muted font-semibold"
											/>
										</div>
									</div>

									{/* Admin Note */}
									<FormField
										control={control}
										name="admin_note"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Admin Note</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Internal notes, special requests, logs..."
														className="min-h-32"
														{...field}
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Sticky Bottom Bar */}
						<div className="sticky bottom-0 bg-background border-t py-4 mt-8">
							<div className="flex justify-end gap-4">
								<Button type="button" variant="outline" onClick={() => navigate(-1)}>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting || !!booking.cancelled_at}>
									{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Save Changes
								</Button>
							</div>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}
