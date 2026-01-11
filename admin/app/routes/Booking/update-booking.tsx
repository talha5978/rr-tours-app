import { zodResolver } from "@hookform/resolvers/zod";
import {
	BOOKING_STATUS,
	PAYMENT_REF_DIMENSIONS,
	PAYMENT_STATUS,
} from "@workspace/shared/constants/constants";
import {
	UpdateBookingActionData,
	type UpdateBookingInput,
	UpdateBookingSchema,
} from "@workspace/shared/schemas/booking.schema";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { queryClient } from "@workspace/shared/utils/query-client";
import { AlertCircle, Loader2 } from "lucide-react";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { getBookingDetailById } from "~/queries/bookings.q";
import DatePicker from "~/components/Custom-Inputs/date-picker";
import { Label } from "~/components/ui/label";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { PhoneInput } from "~/components/Custom-Inputs/phone-number-input";
import { format } from "date-fns";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import { BookingService } from "@workspace/shared/services/booking.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		throw new Response("Booking ID is required", { status: 400 });
	}
	const ref = (params.ref as string) || "";
	if (!ref || ref == "") {
		throw new Response("Booking ref is required", { status: 400 });
	}
	const formData = await request.formData();
	// console.log("Form booking: ", formData);
	const booking: UpdateBookingActionData = {};

	if (formData.has("payload") && formData.get("payload") !== "") {
		const rawPayload = JSON.parse(formData.get("payload") as string);
		if (rawPayload.admin_note !== undefined) booking.admin_note = rawPayload.admin_note;
		if (rawPayload.booking_status) booking.booking_status = rawPayload.booking_status;
		if (rawPayload.payment_status) booking.payment_status = rawPayload.payment_status;

		if (rawPayload.customer_name) booking.customer_name = rawPayload.customer_name;
		if (rawPayload.customer_email) booking.customer_email = rawPayload.customer_email;
		if (rawPayload.customer_phone) booking.customer_phone = rawPayload.customer_phone;
		if (rawPayload.preffered_date) booking.preffered_date = rawPayload.preffered_date;
		if (rawPayload.preffered_time !== undefined) booking.preffered_time = rawPayload.preffered_time;
		if (rawPayload.confirmed_date) booking.confirmed_date = rawPayload.confirmed_date;
		if (rawPayload.confirmed_time !== undefined) booking.confirmed_time = rawPayload.confirmed_time;
		if (rawPayload.discount != undefined) booking.discount = rawPayload.discount;
		if (rawPayload.taxes != undefined) booking.taxes = rawPayload.taxes;
		if (rawPayload.participants_unit_prices && rawPayload.participants_unit_prices.length > 0)
			booking.participants_unit_prices = rawPayload.participants_unit_prices;
	}

	if (formData.has("payment_ref") && formData.get("payment_ref") instanceof File) {
		booking.payment_ref = formData.get("payment_ref") as File;
	}

	const svc = new BookingService(request);
	// return;
	try {
		await svc.updateBooking(id, booking);

		await queryClient.invalidateQueries({ queryKey: ["high_level_bookings"] });
		await queryClient.invalidateQueries({ queryKey: ["booking", id] });

		const cacheSvc = new CacheInvalidationService(request);
		await cacheSvc.pushCacheInvalidationEvent({
			target: "front",
			keys: [`fp_booking||${ref}`],
		});

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update booking",
		};
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

	const response = await queryClient.fetchQuery(getBookingDetailById({ request, id }));
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
		disabled: booking.cancelled_at != null || booking.confirmed_at != null,
		defaultValues: {
			admin_note: booking.admin_note === null ? "" : booking.admin_note,
			booking_status: booking.booking_status,
			payment_status: booking.payment_status,

			preffered_date: booking.preferred_date === null ? null : new Date(booking.preferred_date),
			preffered_time: booking.preferred_timeslot === null ? "" : booking.preferred_timeslot,
			confirmed_date: booking.confirmed_date === null ? null : new Date(booking.confirmed_date),
			confirmed_time: booking.confirmed_timeslot === null ? "" : booking.confirmed_timeslot,

			customer_email: booking.customer_email ?? "",
			customer_name: booking.customer_name ?? "",
			customer_phone: booking.customer_phone ?? "",

			taxes: booking.taxes.toString() ?? "0",
			discount: booking.discount.toString() ?? "0",

			payment_ref: booking.payment_ref === null ? undefined : booking.payment_ref,

			participants_unit_prices: booking.booking_participants.map((p) => ({
				booking_participant_id: p.id,
				quantity: p.quantity,
				unit_price: p.unit_price,
			})),
		},
	});

	const { handleSubmit, setError, control } = form;

	const { fields } = useFieldArray({
		control,
		name: "participants_unit_prices",
	});

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "PATCH";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success(`${booking.booking_ref} booking updated successfully`);
				navigate(`/bookings`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form booking. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateBookingInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateBookingInput) {
		if (booking == null) {
			toast.error("Booking not found. Please try again.");
			return;
		}

		if (typeof booking.payment_ref === "string" && values.payment_ref == null) {
			toast.error(
				"Deletion o600f payment reference is not allowed. Please upload other payment reference or don't delete the existing one.",
			);
			return;
		}

		const payload: UpdateBookingActionData = {};

		// Helper to check if value changed (handles null/undefined/Date)
		const hasChanged = (newVal: any, oldVal: any): boolean => {
			// Handle Date objects
			if (newVal instanceof Date && oldVal instanceof Date) {
				return newVal.getTime() !== oldVal.getTime();
			}
			// Handle null/undefined
			if (newVal === null || newVal === undefined || newVal === "") {
				return oldVal !== null && oldVal !== undefined && oldVal !== "";
			}
			return newVal !== oldVal;
		};

		// 1. Simple scalar fields
		if (hasChanged(values.booking_status, booking.booking_status)) {
			payload.booking_status = values.booking_status;
		}
		if (hasChanged(values.payment_status, booking.payment_status)) {
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

		// 2. Date fields (convert to ISO string for comparison)
		if (values.preffered_date instanceof Date) {
			const newDate = format(values.preffered_date, "yyyy-MM-dd");
			if (newDate !== booking.preferred_date) {
				payload.preffered_date = newDate;
			}
		} else if (values.preffered_date == null && booking.preferred_date != null) {
			payload.preffered_date = null;
		}

		if (hasChanged(values.preffered_time, booking.preferred_timeslot)) {
			payload.preffered_time = values.preffered_time || null;
		}

		if (values.confirmed_date instanceof Date) {
			const newDate = format(values.confirmed_date, "yyyy-MM-dd");
			if (newDate !== booking.confirmed_date) {
				payload.confirmed_date = newDate;
			}
		} else if (values.confirmed_date == null && booking.confirmed_date != null) {
			payload.confirmed_date = null;
		}

		if (hasChanged(values.confirmed_time, booking.confirmed_timeslot)) {
			payload.confirmed_time = values.confirmed_time || null;
		}

		// 4. Participants - deep diff
		const originalParticipants = booking.booking_participants.map((p) => ({
			booking_participant_id: p.id,
			quantity: p.quantity,
			unit_price: p.unit_price,
		}));

		const changedParticipants = values.participants_unit_prices.filter((newP, index) => {
			const oldP = originalParticipants[index];
			if (!oldP) return true; // new one (though in your case shouldn't happen)

			return newP.quantity !== oldP.quantity || newP.unit_price !== oldP.unit_price;
		});

		if (changedParticipants.length > 0) {
			payload.participants_unit_prices = changedParticipants;
		}

		// If nothing changed → early exit
		if (Object.keys(payload).length === 0) {
			if (values.payment_ref && typeof values.payment_ref !== "string") {
			} else {
				toast.info("No changes detected.");
				return;
			}
		}

		console.log(payload);

		// Submit only changed fields
		const formData = new FormData();
		formData.append("payload", JSON.stringify(payload));

		if (values.payment_ref && typeof values.payment_ref !== "string") {
			formData.set("payment_ref", values.payment_ref);
		}

		submit(formData, {
			method: "PATCH",
			action: `/bookings/${booking.id}/${booking.booking_ref}/update`,
			encType: "multipart/form-data",
		});
	}

	const watchedParticipants = useWatch({ control, name: "participants_unit_prices" }) ?? [];
	const watchedDiscountRaw = useWatch({ control, name: "discount" }) ?? 0;
	const watchedTaxesRaw = useWatch({ control, name: "taxes" }) ?? 0;

	const discount = Number(watchedDiscountRaw) || 0;
	const taxes = Number(watchedTaxesRaw) || 0;

	const subtotal = watchedParticipants.reduce((sum, p) => {
		const qty = Number(p?.quantity) || 0;
		const price = Number(p?.unit_price) || 0;
		return sum + qty * price;
	}, 0);

	const total = subtotal - discount + taxes;

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
						{(booking.confirmed_at != null || booking.cancelled_at != null) && (
							<Badge className="w-fit h-fit">Read Only</Badge>
						)}
					</div>
				</div>
				<form className="space-y-8" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Main Content - Two-column layout on desktop, stacked on mobile */}
						<div className="grid lg:grid-cols-2 gap-4">
							{/* Left Column - Core Info */}
							<Card className="h-fit">
								<CardHeader>
									<CardTitle>Core Information</CardTitle>
								</CardHeader>
								<Separator />
								<CardContent>
									<div className="space-y-8">
										{/* Tour */}
										<div className="space-y-5">
											<h3 className="text-base font-medium text-foreground">
												Selected Tour
											</h3>
											<div className="grid gap-2">
												<Label className="text-sm">Tour</Label>
												<Input
													type="text"
													value={booking.tour_name ?? "Unknown"}
													className="pointer-events-none disabled:cursor-not-allowed"
													disabled
												/>
											</div>
											<div className="grid gap-2">
												<Label className="text-sm">Option</Label>
												<Input
													type="text"
													value={booking.tour_option_name ?? "Unknown"}
													className="pointer-events-none disabled:cursor-not-allowed"
													disabled
												/>
											</div>
										</div>
										{/* Status Section */}
										<div className="space-y-5">
											<h3 className="text-base font-medium text-foreground">
												Booking & Payment Status
											</h3>
											<div className="grid gap-6 sm:grid-cols-2">
												<FormField
													control={control}
													name="booking_status"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Booking Status
															</FormLabel>
															<FormControl>
																<Select
																	onValueChange={field.onChange}
																	defaultValue={field.value}
																>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select status" />
																	</SelectTrigger>
																	<SelectContent>
																		{BOOKING_STATUS.map((status) => (
																			<SelectItem
																				key={status}
																				value={status}
																			>
																				{status}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>

												<FormField
													control={control}
													name="payment_status"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Payment Status
															</FormLabel>
															<FormControl>
																<Select
																	onValueChange={field.onChange}
																	defaultValue={field.value}
																>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select status" />
																	</SelectTrigger>
																	<SelectContent>
																		{PAYMENT_STATUS.filter(
																			(status) => status !== "PENDING",
																		).map((status) => (
																			<SelectItem
																				key={status}
																				value={status}
																			>
																				{status}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>
											</div>
											<div>
												<FormField
													control={control}
													name="payment_ref"
													render={() => (
														<FormItem>
															<FormLabel className="text-sm">
																Payment Reference
															</FormLabel>
															<FormControl>
																<ImageInput
																	name="payment_ref"
																	dimensions={PAYMENT_REF_DIMENSIONS}
																	aspectRatio="square"
																/>
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>
											</div>
										</div>

										{/* Customer Info */}
										<div className="space-y-5">
											<h3 className="text-base font-medium text-foreground">
												Customer Information
											</h3>
											<div className="grid gap-4">
												<FormField
													control={control}
													name="customer_name"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Full Name
															</FormLabel>
															<FormControl>
																<Input type="text" {...field} />
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>

												<FormField
													control={control}
													name="customer_email"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">Email</FormLabel>
															<FormControl>
																<Input type="email" {...field} />
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>

												<FormField
													control={control}
													name="customer_phone"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Phone Number
															</FormLabel>
															<FormControl>
																<PhoneInput {...field} />
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Right Column - Dates, Pricing, Note */}
							<Card className="h-fit">
								<CardHeader>
									<CardTitle>Dates & Pricing</CardTitle>
								</CardHeader>
								<Separator />
								<CardContent>
									<div className="space-y-8">
										{/* Dates */}
										<div className="space-y-5">
											<h3 className="text-base font-medium text-foreground">
												Dates & Times
											</h3>
											<div className="space-y-4">
												<div className="grid gap-6 sm:grid-cols-2">
													<div className="space-y-4 p-4 border-2 rounded-lg">
														<p className="text-xs font-medium text-muted-foreground">
															Preferred
														</p>
														<div className="grid gap-4">
															<FormField
																control={control}
																name="preffered_date"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel className="text-sm">
																			Date
																		</FormLabel>
																		<FormControl>
																			<DatePicker
																				defaultMonth={
																					field.value || new Date()
																				}
																				popover_align="end"
																				value={field.value ?? null}
																				onDateChange={field.onChange}
																			/>
																		</FormControl>
																		<FormMessage className="text-xs" />
																	</FormItem>
																)}
															/>
															<FormField
																control={control}
																name="preffered_time"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel className="text-sm">
																			Timeslot
																		</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				placeholder="e.g. 10:00 AM"
																				value={field.value ?? ""}
																			/>
																		</FormControl>
																		<FormMessage className="text-xs" />
																	</FormItem>
																)}
															/>
														</div>
													</div>

													<div className="space-y-4 p-4 border-2 rounded-lg">
														<p className="text-xs font-medium text-muted-foreground">
															Confirmed
														</p>
														<div className="grid gap-4">
															<FormField
																control={control}
																name="confirmed_date"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel className="text-sm">
																			Date
																		</FormLabel>
																		<FormControl>
																			<DatePicker
																				popover_align="end"
																				defaultMonth={
																					field.value || new Date()
																				}
																				value={field.value ?? null}
																				onDateChange={field.onChange}
																			/>
																		</FormControl>
																		<FormMessage className="text-xs" />
																	</FormItem>
																)}
															/>
															<FormField
																control={control}
																name="confirmed_time"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel className="text-sm">
																			Timeslot
																		</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				placeholder="e.g. 10:00 AM"
																				value={field.value ?? ""}
																			/>
																		</FormControl>
																		<FormMessage className="text-xs" />
																	</FormItem>
																)}
															/>
														</div>
													</div>
												</div>
												<div className="space-y-1">
													{booking.confirmed_at && (
														<div className="text-muted-foreground">
															Confirmed at{" "}
															{format(booking.confirmed_at, "PPPP p")}
														</div>
													)}

													{booking.cancelled_at && (
														<div className="text-muted-foreground">
															Cancelled at{" "}
															{format(booking.cancelled_at, "PPPP p")}
														</div>
													)}
												</div>
											</div>
										</div>

										{/* Pricing & Note */}
										<div className="space-y-5">
											<h3 className="text-base font-medium text-foreground">
												Pricing & Admin Note
											</h3>
											<div className="grid gap-6">
												{!changePricing ? (
													<div className="ml-auto w-fit">
														<Button
															size={"sm"}
															variant={"destructive"}
															onClick={() => setChangePricing(true)}
														>
															Change Per Participant Pricing
														</Button>
													</div>
												) : (
													<div className="space-y-4">
														<div className="space-y-1">
															<h4 className="text-sm">Participants</h4>
															<p className="text-xs text-muted-foreground">
																Change the pricing for each participant if
																needed
															</p>
														</div>
														{booking.price_overriden && (
															<div className="ml-auto w-fit">
																<Badge variant={"destructive"}>
																	<AlertCircle className="h-5 w-5" />
																	<p className="text-sm">
																		Price Already Overriden!
																	</p>
																</Badge>
															</div>
														)}
														<div className="grid sm:grid-cols-2 gap-4">
															{fields.map((field, index) => {
																const participant =
																	booking.booking_participants.find(
																		(p) =>
																			p.id ===
																			field.booking_participant_id,
																	);
																return (
																	<div
																		key={field.id}
																		className="space-y-4 p-4 border-2 rounded-lg"
																	>
																		<div className="grid gap-2">
																			<Label className="text-sm">
																				Type
																			</Label>
																			<Input
																				value={
																					participant
																						?.participant_type
																						.name
																						? `${participant?.participant_type.name} (${participant?.participant_type.age_min}-${participant?.participant_type.age_max})`
																						: "Unknown"
																				}
																				className="pointer-events-none disabled:cursor-not-allowed"
																				disabled
																			/>
																		</div>
																		<FormField
																			control={control}
																			name={`participants_unit_prices.${index}.quantity`}
																			render={({ field }) => (
																				<FormItem>
																					<FormLabel className="text-sm">
																						Quantity
																					</FormLabel>
																					<FormControl>
																						<Input
																							type="number"
																							min="1"
																							{...field}
																							onChange={(e) =>
																								field.onChange(
																									Number(
																										e
																											.target
																											.value,
																									),
																								)
																							}
																						/>
																					</FormControl>
																					<FormMessage className="text-xs" />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={control}
																			name={`participants_unit_prices.${index}.unit_price`}
																			render={({ field }) => (
																				<FormItem>
																					<FormLabel className="text-sm">
																						Unit Price (AED)
																					</FormLabel>
																					<FormControl>
																						<Input
																							type="number"
																							step="0.1"
																							{...field}
																							onChange={(e) =>
																								field.onChange(
																									Number(
																										e
																											.target
																											.value,
																									),
																								)
																							}
																						/>
																					</FormControl>
																					<FormMessage className="text-xs" />
																				</FormItem>
																			)}
																		/>
																	</div>
																);
															})}
														</div>
													</div>
												)}

												<div className="grid sm:grid-cols-2 gap-4">
													<FormField
														control={control}
														name="discount"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="text-sm">
																	Discount (AED)
																</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		step="0.1"
																		{...field}
																	/>
																</FormControl>
																<FormMessage className="text-xs" />
															</FormItem>
														)}
													/>

													<FormField
														control={control}
														name="taxes"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="text-sm">
																	Taxes (AED)
																</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		step="0.1"
																		{...field}
																	/>
																</FormControl>
																<FormMessage className="text-xs" />
															</FormItem>
														)}
													/>
													<div className="grid gap-2">
														<Label className="text-sm">Sub Total (AED)</Label>
														<Input
															type="number"
															value={formattedSubtotal}
															className="pointer-events-none disabled:cursor-not-allowed"
															disabled
														/>
													</div>
													<div className="grid gap-2">
														<Label className="text-sm">Total (AED)</Label>
														<Input
															type="number"
															value={formattedTotal}
															className="pointer-events-none disabled:cursor-not-allowed"
															disabled
														/>
													</div>
												</div>

												<FormField
													control={control}
													name="admin_note"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Admin Note
															</FormLabel>
															<FormControl>
																<Textarea
																	className="min-h-25 resize-none"
																	placeholder="Internal notes, special instructions, communication log..."
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage className="text-xs" />
														</FormItem>
													)}
												/>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Sticky Bottom Bar */}
						<div className="sticky bottom-0 left-0 right-0 bg-background border-t py-4 mt-8">
							<div className="flex justify-end gap-4">
								<Button type="button" variant="outline" onClick={() => navigate(-1)}>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={
										isSubmitting ||
										booking.confirmed_at != null ||
										booking.cancelled_at != null
									}
								>
									{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
