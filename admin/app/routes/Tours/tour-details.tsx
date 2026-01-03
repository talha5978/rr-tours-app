import { Link, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { format, isBefore, startOfToday } from "date-fns";
import { ArrowRight, Check, ClockFading, Edit, MapPinned, X } from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "~/components/ui/label";
import { HTMLAttributes, type HtmlHTMLAttributes, memo, useMemo, useState } from "react";
import DatePicker from "~/components/Custom-Inputs/date-picker";
import TourImageCarousel from "~/components/Tour/TourImageCarousel";
import { Separator } from "~/components/ui/separator";
import { queryClient } from "@workspace/shared/utils/query-client";
import { tourDetailsQuery } from "~/queries/tours.q";
import type { GetTourDetails, TourDetailAvailability, TourDetailOption } from "@workspace/shared/types/tours";
import { cn } from "@workspace/shared/utils/ui";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { Tables } from "@workspace/shared/types/supabase";
import { toast } from "sonner";
import QuantityInput from "~/components/Custom-Inputs/quantity-input-basic";
import BackButton from "~/components/Nav/BackButton";
import { Badge } from "~/components/ui/badge";

const participantSchema = z.object({
	quantities: z.record(z.number().min(0).int()),
});

type ParticipantForm = z.infer<typeof participantSchema>;
type AvailabilitySlot = TourDetailAvailability["slots"][0];
type DialogSteps = "date" | "time" | "participants";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	if (!params.id || params.id === "") return null;

	const data = await queryClient.fetchQuery(tourDetailsQuery({ request, tour_id: params.id }));
	return data;
};

export default function TourDetailsPage() {
	const tour = useLoaderData<typeof loader>();
	const [selectedOption, setSelectedOption] = useState<TourDetailOption | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailabilitySlot | null>(null);
	const [step, setStep] = useState<DialogSteps>("date");
	const [stepsDialogOpen, setStepsDialogOpen] = useState(false);

	if (!tour) return <div>Tour not found</div>;
	if (tour.tour_options.some((opt) => opt.availabilities == null)) return <div>Error loading tour</div>;

	console.log("Re rendreed");
	console.log(tour);

	const availableDates = tour.tour_options.flatMap(
		(opt: any) =>
			opt.availabilities
				.filter((a: TourDetailAvailability) => a.isActive)
				.map((a: TourDetailAvailability) => new Date(a.date)) || [],
	);

	const isDateAvailable = (date: Date) =>
		availableDates.some((d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));

	const getTimeSlotsForDate = (date: Date, option: TourDetailOption) => {
		const formattedDate = format(date, "yyyy-MM-dd");
		const avail = option.availabilities.find((a: TourDetailAvailability) => a.date === formattedDate);
		return avail?.slots.sort((a, b) => a.time_slot.sort_order - b.time_slot.sort_order) || [];
	};

	const checkIfNoSlotsAvailable = () => {
		return (
			selectedDate &&
			selectedOption &&
			getTimeSlotsForDate(selectedDate, selectedOption).every(
				(s) => s.available_seats === 0 && s.seat_type === "LIMITED",
			)
		);
	};

	const handleButtonClick = (option: TourDetailOption) => {
		setStepsDialogOpen(true);
		setSelectedOption(option);
		setStep("date");
	};

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			setSelectedDate(date);
		}
	};

	const handleTimeSelect = (timeSlot: AvailabilitySlot) => {
		setSelectedTimeSlot(timeSlot);
		setStep("participants");
	};

	const handleBack = () => {
		if (step === "time") setStep("date");
		if (step === "participants") setStep("time");
	};

	const tour_images = useMemo(() => {
		const filteredImages = tour?.images?.filter((i: string | null) => i != null) ?? [];
		return [
			{ url: tour.cover_image, title: tour.name + " Cover" },
			...filteredImages.map((j: string, idx: number) => ({
				url: j,
				title: tour.name + " Secondary Image " + idx,
			})),
		];
	}, [tour]);

	function getNextAvailabilityMsg(option: TourDetailOption) {
		if (option.availabilities) {
			const nextDate = option.availabilities.map((a) => {
				return a.date;

				// --> Logic for displaying the availability message only on the limited seats options
				// const ss = a.slots.find(
				// 	(s) => s.seat_type === "LIMITED" && (s.available_seats as number) > 0,
				// );

				// if (ss) {
				// 	return a.date;
				// }
			})[0];

			if (nextDate) {
				return `Next available at ${format(nextDate, "PPPP")}`;
			} else {
				return null;
			}
		} else {
			return null;
		}
	}

	return (
		<>
			<MetaDetails
				metaTitle={tour.name + " | Tour Preview"}
				metaDescription={tour.overview.slice(0, 150)}
				metaKeywords={tour.meta_details?.meta_keywords ?? tour.name}
				// canonicalUrl={`https://www.topattractionsdubai.com/tours/tour/` + tour.id + "/" + tour.meta_details?.url_key}
				// ogUrl={`https://www.topattractionsdubai.com/tours/tour/` + tour.id + "/" + tour.meta_details?.url_key}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image}
				ogType="product"
				hasPricing
				pricing={{
					price: Math.min(...tour.tour_options.map(getMinPrice)).toString(),
				}}
			/>
			{/* <TourStructuredData tour={{ name: tour.name, overview: tour.overview, image: tour.cover_image }} canonicalUrl={`https://www.topattractionsdubai.com/tours/tour/` + tour.id + "/" + tour.meta_details?.url_key} /> */}
			<div className="container mx-auto p-4 space-y-8">
				{/* Header */}
				<div className="space-y-2">
					<div className="flex gap-4 items-center flex-wrap">
						<BackButton href={"/tours"} />
						<h1 className="text-3xl font-bold">{tour.name}</h1>
					</div>

					<div className="flex gap-4 flex-wrap items-center">
						{tour.tour_category && (
							<>
								<Link
									to={
										`/FRONTPANEL/tour-categories/tour-category` +
										tour.tour_category.id +
										"/" +
										tour.tour_category.url_key
									}
								>
									<div>
										<p className="text-sm text-muted-foreground">
											{tour.tour_category.name}
										</p>
									</div>
								</Link>
								<span className="h-fit min-w-fit text-muted-foreground">•</span>
							</>
						)}
						<Link to={`/FRONTPANEL/cities/city` + tour.city?.id + "/" + tour.city?.url_key}>
							<div>
								<p className="text-sm text-muted-foreground">{tour.city?.name}</p>
							</div>
						</Link>
						{tour.provider && <span className="h-fit min-w-fit text-muted-foreground">•</span>}
						{tour.provider && (
							<div>
								<p className="text-sm text-muted-foreground">
									Provided by {tour.provider.name}
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="grid lg:grid-cols-[3fr_2fr] gap-6">
					{/* Left side */}
					<div className="space-y-10">
						<div>
							<div className="min-[1150px]:inline hidden">
								<TourImageCarousel images={tour_images} />
							</div>
							<div className="inline min-[1150px]:hidden">
								<TourImageCarousel images={tour_images} thumbPosition="bottom" />
							</div>
						</div>

						<section className="lg:hidden">
							<AttributesCard tour={tour} />
						</section>

						<div className="space-y-8">
							{/* Tour Options */}
							<div className="space-y-4">
								<h2 className="text-2xl font-semibold">Available Options</h2>
								{tour.tour_options
									.sort((a, b) => a.sort_order - b.sort_order)
									.map((option) => (
										<Card key={option.id} className="pt-0">
											<CardHeader className="bg-accent pt-4 pb-3 rounded-t-xl">
												<CardTitle className="sm:flex sm:flex-wrap gap-4 items-center justify-between">
													<h3 className="text-lg">{option.name}</h3>
													{option.isOpenDated && (
														<div className="max-sm:hidden">
															<Badge className="bg-warning py-1.5">
																Open Dated
															</Badge>
														</div>
													)}
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												{option.inclusions ? (
													<div className="[&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-4 [&>ul]:mt-1">
														<h2 className="text-lg font-semibold">Inclusions:</h2>
														<ul>
															{option.inclusions
																?.split("\n")
																.filter((ln: string) => ln.trim())
																.slice(0, 2)
																.map((ln: string, index: number) => (
																	<li key={index}>
																		{ln}
																		{option.inclusions &&
																		option?.inclusions?.split("\n")
																			.length > 2 &&
																		index === 1
																			? "...."
																			: ""}
																	</li>
																))}
														</ul>
													</div>
												) : option.exclusions ? (
													<div className="[&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-4 [&>ul]:mt-1">
														<h2 className="text-lg font-semibold">Exclusions:</h2>
														<ul>
															{option.exclusions
																?.split("\n")
																.filter((ln: string) => ln.trim())
																.slice(0, 2)
																.map((ln: string, index: number) => (
																	<li key={index}>
																		{ln}
																		{option.exclusions &&
																		option?.exclusions?.split("\n")
																			.length > 2 &&
																		index === 1
																			? "...."
																			: ""}
																	</li>
																))}
														</ul>
													</div>
												) : null}

												<div>
													<p className="text-muted-foreground">
														From {getMinPrice(option)} AED
													</p>
													<p className="text-destructive">
														{option.availabilities.every((a) =>
															a.slots.every(
																(s) =>
																	s.seat_type === "LIMITED" &&
																	s.available_seats === 0,
															),
														)
															? "Fully Booked"
															: ""}
													</p>
													{getNextAvailabilityMsg(option) != null && (
														<p className="text-muted-foreground">
															{getNextAvailabilityMsg(option)}
														</p>
													)}
												</div>

												<div className="flex gap-4 flex-wrap mt-6">
													{/* View Details Dialog */}
													<Dialog>
														<DialogTrigger asChild>
															<Button variant={"outline"} size={"sm"}>
																View Details
															</Button>
														</DialogTrigger>
														<DialogContent className="max-w-xl">
															<DialogHeader className="mb-2">
																<DialogTitle>Option Details</DialogTitle>
															</DialogHeader>

															<div className="bg-accent p-4 rounded-lg">
																<h3 className="font-semibold text-base">
																	{tour.name}
																</h3>
																<div className="flex gap-2 justify-between flex-wrap items-center">
																	<p className="text-sm">{option.name}</p>
																	{option.isOpenDated && (
																		<div>
																			<Badge className="bg-warning">
																				Open Dated
																			</Badge>
																		</div>
																	)}
																</div>
															</div>

															<div className="space-y-4">
																<MainBodySection
																	content={option.inclusions}
																	title="Inclusions"
																	titleClassName="text-lg"
																	containerClassName="[&>ul]:mt-1"
																/>
																<MainBodySection
																	content={option.exclusions}
																	title="Exclusions"
																	titleClassName="text-lg"
																	containerClassName="[&>ul]:mt-1"
																/>
																<MainBodySection
																	content={option.note}
																	title="Special Note"
																	titleClassName="text-lg"
																	containerClassName="[&>ul]:mt-1"
																/>

																<div className="flex gap-2 justify-between items-center">
																	<p className="text-lg font-semibold">
																		From {getMinPrice(option)} AED
																	</p>
																	<Button
																		size={"icon"}
																		onClick={() =>
																			handleButtonClick(option)
																		}
																	>
																		<ArrowRight className="w-4 h-4" />
																	</Button>
																</div>
															</div>
														</DialogContent>
													</Dialog>

													<div className="w-fit ml-auto">
														<Button
															onClick={() => handleButtonClick(option)}
															size={"sm"}
														>
															Select
														</Button>
													</div>

													<Dialog
														onOpenChange={() => {
															setSelectedDate(undefined);
															setStepsDialogOpen(false);
														}}
														open={stepsDialogOpen}
													>
														<DialogContent className="max-w-lg">
															<DialogHeader className="mb-2">
																<DialogTitle>
																	Select your preferences
																</DialogTitle>
															</DialogHeader>
															{/* Secondary Header */}
															<div className="bg-accent p-4 rounded-lg">
																<h3 className="font-semibold text-base">
																	{tour.name}
																</h3>
																{selectedOption && (
																	<div className="flex gap-2 justify-between flex-wrap items-center">
																		<p className="text-sm">
																			{selectedOption.name}
																		</p>
																		{option.isOpenDated && (
																			<div>
																				<Badge className="bg-warning">
																					Open Dated
																				</Badge>
																			</div>
																		)}
																	</div>
																)}

																{step === "time" && selectedDate && (
																	<div className="flex gap-2 items-center justify-between">
																		<p className="text-sm mt-1">
																			{format(selectedDate, "PPPP")}
																		</p>
																		<Button
																			type="button"
																			size={"sm"}
																			variant={"ghost"}
																			onClick={handleBack}
																			className="cursor-pointer flex gap-2"
																		>
																			<Edit className="w-4 h-4 " />
																			<span className="text-sm">
																				Edit Date
																			</span>
																		</Button>
																	</div>
																)}

																{step === "participants" &&
																	selectedDate &&
																	selectedTimeSlot && (
																		<div>
																			<p className="text-sm">
																				{format(selectedDate, "PPPP")}
																			</p>
																			<div className="flex gap-2 items-center justify-between">
																				<p className="text-sm">
																					{
																						selectedTimeSlot
																							.time_slot.label
																					}
																				</p>
																				<Button
																					type="button"
																					size={"sm"}
																					variant={"ghost"}
																					onClick={handleBack}
																					className="cursor-pointer flex gap-2"
																				>
																					<Edit className="w-4 h-4 " />
																					<span className="text-sm">
																						Edit TimeSlot
																					</span>
																				</Button>
																			</div>
																		</div>
																	)}
															</div>

															{step === "date" && (
																<div className="space-y-4">
																	<p>
																		Select{" "}
																		{selectedOption?.isOpenDated
																			? "your preffered date"
																			: "a date"}
																	</p>
																	{[
																		{
																			className: "max-[32rem]:hidden",
																			months: 2,
																			align: "center",
																		},
																		{
																			className:
																				"max-[32rem]:block hidden",
																			months: 1,
																			align: "start",
																		},
																	].map(
																		({ className, months, align }, i) => (
																			<div
																				className={className}
																				key={i}
																			>
																				<DatePicker
																					popover_align={
																						align as any
																					}
																					numberOfMonths={months}
																					value={selectedDate}
																					onDateChange={
																						handleDateSelect
																					}
																					date_disabled={(date) =>
																						isBefore(
																							date,
																							startOfToday(),
																						) ||
																						!isDateAvailable(
																							date,
																						) ||
																						(selectedOption &&
																						selectedOption.availabilities &&
																						!selectedOption.availabilities.find(
																							(a) =>
																								a.date ===
																								format(
																									date,
																									"yyyy-MM-dd",
																								),
																						)?.isActive
																							? true
																							: false)
																					}
																				/>
																			</div>
																		),
																	)}

																	{checkIfNoSlotsAvailable() == true && (
																		<p className="text-destructive">
																			Sorry! No timeslot is available
																			for this date.
																		</p>
																	)}

																	<div className="w-fit ml-auto">
																		<Button
																			size={"sm"}
																			onClick={() => setStep("time")}
																			disabled={
																				(checkIfNoSlotsAvailable()
																					? true
																					: false) || !selectedDate
																			}
																		>
																			Next
																		</Button>
																	</div>
																</div>
															)}

															{step === "time" &&
																selectedDate &&
																selectedOption && (
																	<div className="space-y-4">
																		<p>
																			Select{" "}
																			{selectedOption?.isOpenDated
																				? "your preffered timeslot"
																				: "a timeslot"}
																		</p>
																		<div className="flex gap-2 flex-wrap">
																			{getTimeSlotsForDate(
																				selectedDate,
																				selectedOption,
																			).map(
																				(slot: AvailabilitySlot) => {
																					const disabled =
																						slot.available_seats ===
																							0 &&
																						slot.seat_type ===
																							"LIMITED";

																					return (
																						<Button
																							key={slot.id}
																							variant={
																								"secondary"
																							}
																							className={`w-fit ${disabled ? "pointer-events-none" : "border-2 border-primary"}`}
																							onClick={() =>
																								handleTimeSelect(
																									slot,
																								)
																							}
																							disabled={
																								disabled
																							}
																						>
																							{slot.time_slot
																								.label
																								? `${slot.time_slot.label}`
																								: slot
																										.time_slot
																										.time}
																						</Button>
																					);
																				},
																			)}
																		</div>
																	</div>
																)}

															{step === "participants" &&
																selectedOption &&
																selectedTimeSlot && (
																	<ParticipantFormComponent
																		option={selectedOption}
																		selectedTimeSlot={selectedTimeSlot}
																	/>
																)}
														</DialogContent>
													</Dialog>
												</div>
											</CardContent>
										</Card>
									))}
							</div>

							{/* Sections */}
							<section>
								<h2 className="text-2xl font-semibold">Overview</h2>
								<p className="mt-4">{tour.overview}</p>
							</section>

							<MainBodySection title="Highlights" content={tour.highlights} />
							<MainBodySection title="Know Before You Go" content={tour.know_before_you_go} />
							<MainBodySection
								title="Age and Health Restrictions"
								content={tour.age_health_restrictions}
							/>

							{tour.cancellation_policy_detail && tour.cancellation_policy_detail.policy && (
								<section id="cancellation-policy">
									<h2 className="text-2xl font-semibold">Cancellation Policy</h2>
									<p className="mt-4">{tour.cancellation_policy_detail.policy}</p>
								</section>
							)}
							{tour.address_name && tour.address_link && (
								<section>
									<h2 className="text-2xl font-semibold">Location</h2>
									<div className="mt-4 flex gap-2 items-center">
										<MapPinned className="h-4 w-4" />
										<a
											href={"https://google.com/search?q=" + tour.address_name}
											target={"_blank"}
											className="underline-offset-4 hover:underline hover:text-primary focus:outline-0 focus:underline focus:underline-offset-4 focus:text-primary"
										>
											{tour.address_name}
										</a>
									</div>
									<iframe
										src={tour.address_link}
										width="100%"
										height="400"
										style={{ border: "0", borderRadius: "10px", marginTop: "1rem" }}
										allowFullScreen
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
									></iframe>
								</section>
							)}
						</div>
					</div>

					{/* Right side */}
					<section className="max-lg:hidden">
						<AttributesCard className="sticky top-10" tour={tour} />
					</section>
				</div>
			</div>
		</>
	);
}

const ParticipantFormComponent = memo(
	({ option, selectedTimeSlot }: { option: TourDetailOption; selectedTimeSlot: AvailabilitySlot }) => {
		const { control, handleSubmit } = useForm<ParticipantForm>({
			resolver: zodResolver(participantSchema),
			defaultValues: {
				quantities: option.prices.reduce((acc: Record<number, number>, price) => {
					acc[price.participant_type.id] = 0;
					return acc;
				}, {}),
			},
		});

		const quantities = useWatch({ control, name: "quantities" });

		function calculatePrice() {
			return Object.entries(quantities).reduce((sum, [typeId, qty]) => {
				const price =
					option.prices.find((p: any) => p.participant_type.id === Number(typeId))?.price || 0;
				return sum + price * (Number(qty) || 0);
			}, 0);
		}

		const totalPrice = useMemo(() => calculatePrice(), [quantities, option]);

		const onSubmit = (data: ParticipantForm) => {
			// Stub for checkout
			console.log("Proceed to checkout", data);
			toast.info("This page is just for preview. Real checkout functionality is not implemented here");
		};

		return (
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<p>Select participants</p>
				{option.prices
					.sort((a, b) => b.participant_type.id - a.participant_type.id)
					.map(
						(
							price: Tables<"tour_option_prices"> & {
								participant_type: Tables<"participant_types">;
							},
						) => {
							const pt = price.participant_type;

							return (
								<div key={pt.id} className="flex gap-2 items-center justify-between">
									<div>
										<div className="flex gap-1">
											<Label
												htmlFor={`qty-${pt.id}`}
												className="font-semibold text-base"
											>
												<p>{pt.name}</p>
												<div>
													{pt.age_max - pt.age_min > 50 ? (
														<p>({pt.age_min}+)</p>
													) : (
														<p>
															({pt.age_min}-{pt.age_max})
														</p>
													)}
												</div>
											</Label>
										</div>
										<p className="text-sm">{price.price} AED</p>
										{selectedTimeSlot.seat_type === "LIMITED" &&
											selectedTimeSlot.available_seats && (
												<p className="text-sm text-muted-foreground">
													{selectedTimeSlot.available_seats} seats available
												</p>
											)}
									</div>
									<div className="w-fit h-fit">
										<Controller
											name={`quantities.${pt.id}`}
											control={control}
											render={({ field }) => (
												<QuantityInput
													id={`qty-${pt.id}`}
													quantity={field.value ?? 0}
													min={0}
													max={
														selectedTimeSlot.seat_type === "UNLIMITED"
															? 100
															: selectedTimeSlot.available_seats
													}
													step={1}
													onChange={(e) => field.onChange(Number(e))}
												/>
											)}
										/>
									</div>
								</div>
							);
						},
					)}
				<p className="font-semibold text-base mt-8">Total: {totalPrice.toFixed(2)} AED</p>
				<div className="w-fit ml-auto">
					<Button type="submit">Checkout</Button>
				</div>
			</form>
		);
	},
);

const AttributesCard = memo(
	({
		tour,
		className,
	}: {
		tour: GetTourDetails;
		className?: HtmlHTMLAttributes<HTMLDivElement>["className"];
	}) => {
		return (
			<Card className={cn("h-fit", className)}>
				<CardContent className="space-y-4">
					<div className="flex flex-col justify-center">
						<h2 className="text-xl font-semibold">
							From {Math.min(...tour.tour_options.map(getMinPrice))} AED
						</h2>
						<p className="text-muted-foreground text-sm">Per Person</p>
					</div>
				</CardContent>
				<Separator />
				<CardContent className="space-y-2">
					<div className="space-y-1">
						{tour.isActive ? (
							<div className="flex items-center gap-2">
								<Check className="h-5 w-5 text-primary" />
								<h3>Tour is active</h3>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<X className="h-5 w-5 text-destructive" />
								<h3>Tour is inactive</h3>
							</div>
						)}
						{tour.isFeatured && (
							<div className="flex items-center gap-2">
								<Check className="h-5 w-5 text-primary" />
								<h3>Displaying on main page</h3>
							</div>
						)}
					</div>
				</CardContent>
				{tour.free_cancelation_avilable == null &&
					tour.duration_minutes == null &&
					tour.live_tour_guide == null &&
					(tour.live_tour_guide_langs == null || tour.live_tour_guide_langs == "") && <Separator />}
				<CardContent className="space-y-2">
					{tour.free_cancelation_avilable && (
						<div className="flex items-center gap-4">
							<Check className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-semibold">Free Cancellation Available</h3>
								<a href="#cancellation-policy" className="underline-offset-4 hover:underline">
									<p className="text-muted-foreground text-sm">
										See cancellation policy for details
									</p>
								</a>
							</div>
						</div>
					)}
					{tour.duration_minutes && (
						<div className="flex items-center gap-4">
							<ClockFading className="h-5 w-5" />
							<div>
								<h3 className="font-semibold">
									Duration Around {tour.duration_minutes} Hours
								</h3>
								<p className="text-muted-foreground text-sm">
									Check availability or contact us for starting times
								</p>
							</div>
						</div>
					)}
					{tour.live_tour_guide &&
						tour.live_tour_guide_langs != "" &&
						tour.live_tour_guide_langs != null && (
							<div className="flex items-center gap-4">
								<Check className="h-5 w-5 text-primary" />
								<div>
									<h3 className="font-semibold">Live Tour Guide Available</h3>
									<p className="text-muted-foreground text-sm">
										{tour.live_tour_guide_langs
											.split(",")
											.map(
												(lang: string, idx: number) =>
													`${lang}${idx === (tour?.live_tour_guide_langs as string).split(",").length - 1 ? "" : ","} `,
											)}
									</p>
								</div>
							</div>
						)}
				</CardContent>
			</Card>
		);
	},
);
const getMinPrice = (option: any) => {
	if (!option.prices?.length) return 0;
	return Math.min(...option.prices.map((p: any) => p.price));
};

const MainBodySection = memo(
	({
		title,
		content,
		titleClassName,
		containerClassName,
	}: {
		title: string;
		content: string | null;
		titleClassName?: HTMLAttributes<HTMLDivElement>["className"];
		containerClassName?: HTMLAttributes<HTMLDivElement>["className"];
	}) => {
		return content != null ? (
			<section
				className={cn(
					"[&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-4 [&>ul]:mt-4",
					containerClassName,
				)}
			>
				<h2 className={cn("text-2xl font-semibold", titleClassName)}>{title}</h2>
				<ul>
					{content
						?.split("\n")
						.filter((ln: string) => ln.trim())
						.map((ln: string, index: number) => (
							<li key={index}>{ln}</li>
						))}
				</ul>
			</section>
		) : null;
	},
);
