import {
	Await,
	Link,
	type LoaderFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
	useRevalidator,
	useSearchParams,
} from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { format, isBefore, startOfToday } from "date-fns";
import {
	Accessibility,
	ArrowRight,
	BadgePlus,
	Calendar,
	CalendarPlusIcon,
	Check,
	ClockFading,
	Edit,
	Heart,
	Loader2,
	MapPinned,
	Star,
} from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "~/components/ui/label";
import { HTMLAttributes, type HtmlHTMLAttributes, memo, Suspense, useMemo, useState } from "react";
import DatePicker from "~/components/Inputs/date-picker";
import TourImageCarousel from "~/components/Tour/TourImageCarousel";
import { Separator } from "~/components/ui/separator";
import { queryClient } from "@workspace/shared/utils/query-client";
import { availabilityQuery, tourDetailsQuery, toursQuery } from "~/queries/tours.q";
import type { GetTourDetails, TourDetailOption } from "@workspace/shared/types/tours";
import { cn, formatTourDurationHours } from "@workspace/shared/utils/ui";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { CONTACT_NUMBER_1, SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { Tables } from "@workspace/shared/types/supabase";
import { toast } from "sonner";
import QuantityInput from "~/components/Inputs/quantity-input";
import { Badge } from "~/components/ui/badge";
import { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import RelatedTours from "~/components/Tour/RelatedTours";
import { ShareDialog } from "~/components/Tour/ShareButton";
import { useFavourites } from "~/utils/favourites.utils";
import {
	getTimeSlotsForDate,
	getUpcomingAvailableDates,
	isDateCoveredByAnyRule,
} from "@workspace/shared/utils/tourDetails";
import { useIsMobile } from "~/hooks/use-mobile";
import { Skeleton } from "~/components/ui/skeleton";
import { tourReviewsQuery } from "~/queries/reviews.q";
import TourReviews, { TourReviewsSkeleton } from "~/components/Tour/TourReviews";
import { AddToCartPayload } from "@workspace/shared/types/cart";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";

const participantSchema = z.object({
	quantities: z.record(z.number().min(0).int()),
});

type ParticipantForm = z.infer<typeof participantSchema>;
type AvailabilitySlot = Tables<"time_slots"> & { capacity: number };
type DialogSteps = "date" | "time" | "participants";

const REVIEWS_PAGE_SIZE = 10;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	if (!params.id || params.id === "") return null;

	const data = await queryClient.fetchQuery(tourDetailsQuery({ request, tour_id: params.id }));
	let relatedToursByCity: FP_HighLevelTour[] = [];
	let relatedToursByCategory: FP_HighLevelTour[] = [];

	if (data?.city?.id) {
		const relatedTours = await queryClient.fetchQuery(
			toursQuery({ request, filters: { cities: [data.city.id.toString()] } }),
		);

		relatedToursByCity = relatedTours.tours;
	}

	if (data?.tour_category?.id) {
		const relatedTours = await queryClient.fetchQuery(
			toursQuery({ request, filters: { categories: [data.tour_category.id.toString()] } }),
		);

		relatedToursByCategory = relatedTours.tours;
	}

	const url = new URL(request.url);
	const optionId = Number(url.searchParams.get("optionId"));
	const dateStr = url.searchParams.get("date");

	let availability: {
		id: number;
		available_seats: number;
	}[] = [];

	if (optionId && dateStr) {
		availability = await queryClient.fetchQuery(availabilityQuery(request, optionId, dateStr));
	}

	const review_page = Number(url.searchParams.get("reviews_page") ?? "1");
	const min_rating = url.searchParams.get("min_rating")
		? Number(url.searchParams.get("min_rating"))
		: undefined;
	const sort_by = url.searchParams.get("sort_by") as "date" | "rating" | undefined;
	const sort_order = url.searchParams.get("sort_order") as "asc" | "desc" | undefined;

	const reviewsData = queryClient.fetchQuery(
		tourReviewsQuery({
			request,
			tour_id: params.id,
			options: {
				limit: REVIEWS_PAGE_SIZE * review_page,
				filters: {
					min_rating,
					sort_by,
					sort_order,
				},
			},
		}),
	);

	const { headers, authId } = genAuthSecurity(request);

	const userData = await queryClient.fetchQuery(currentFullUserQuery({ request, authId, headers }));

	return {
		tour: data,
		relatedToursByCity: relatedToursByCity ?? [],
		relatedToursByCategory: relatedToursByCategory ?? [],
		availability,
		optionId,
		dateStr,
		reviewsData,
		currentReviewPage: review_page,
		userData,
	};
};

const getMinPrice = (option: any) => {
	if (!option.prices?.length) return 0;
	return Math.min(...option.prices.map((p: any) => p.price));
};

function getStructuredData(tour: GetTourDetails) {
	const metaUrl =
		tour.meta_details?.url_key != undefined
			? `${process.env.VITE_MAIN_APP_URL}/tours/tour/` + tour.id + "/" + tour.meta_details?.url_key
			: undefined;

	const schema = {
		"@context": "https://schema.org",
		"@type": "Product",
		"@id": metaUrl,
		name: tour.name,
		description: tour.overview?.slice(0, 300) ?? tour.meta_details?.meta_description ?? "",
		image: [
			SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image,
			...(tour.images ?? []).filter(Boolean).map((img) => SUPABASE_IMAGE_BUCKET_PATH + "/" + img),
		],
		brand: {
			"@type": "Brand",
			name: "WanderNest",
		},
		offers: tour.tour_options.map((option, idx) => ({
			"@type": "Offer",
			name: option.name,
			price: getMinPrice(option).toString(),
			priceCurrency: "AED",
			availability: tour.tour_options.every((opt) => {
				if (opt.availability_rules == null) return false;
				return opt.availability_rules.every((a) =>
					a.time_slots.every((s) => {
						return s.capacity > 0 && s.is_active;
					}),
				);
			})
				? "https://schema.org/InStock"
				: "https://schema.org/OutOfStock",
			url: metaUrl + "#tour-option-" + idx,

			seller: {
				"@type": "Organization",
				name: tour.provider?.name ?? "WanderNest",
			},
		})),
	};

	return schema;
}

export default function TourDetailsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const tour = loaderData?.tour ?? null;
	const isMobile = useIsMobile();
	const revalidator = useRevalidator();
	const navigation = useNavigation();
	const location = useLocation();
	const [_, setSearchParams] = useSearchParams();

	const [selectedOption, setSelectedOption] = useState<TourDetailOption | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailabilitySlot | null>(null);
	const [step, setStep] = useState<DialogSteps>("date");
	const [stepsDialogOpen, setStepsDialogOpen] = useState(false);

	if (!tour) return <div>Tour not found</div>;

	const handleDateNextClick = () => {
		setStep("time");
	};

	const handleButtonClick = (option: TourDetailOption) => {
		setStepsDialogOpen(true);
		setSelectedOption(option);
		setStep("date");
	};

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			setSelectedDate(date);
			setSearchParams(
				{
					optionId: selectedOption?.id.toString() ?? "",
					date: format(date, "yyyy-MM-dd"),
				},
				{
					preventScrollReset: true,
					replace: true,
					state: { scrollPosition: window.scrollY },
				},
			);
			revalidator.revalidate();
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

	const metaUrl =
		tour.meta_details?.url_key != undefined
			? `${process.env.VITE_MAIN_APP_URL}/tours/tour/` + tour.id + "/" + tour.meta_details?.url_key
			: undefined;

	const availability = loaderData?.availability ?? [];

	const isLoadingSlots =
		(selectedDate &&
			selectedOption?.id &&
			format(selectedDate, "yyyy-MM-dd") &&
			availability.length === 0) ||
		(navigation.state === "loading" && navigation.location?.pathname === location.pathname);

	const updatedTimeSlots = useMemo(() => {
		if (!selectedDate || !selectedOption) return [];
		const baseSlots = getTimeSlotsForDate(selectedDate, selectedOption);
		const availabilityMap = new Map(availability.map((s) => [s.id, s.available_seats]));

		return baseSlots.map((slot) => ({
			...slot,
			capacity: availabilityMap.get(slot.id) ?? slot.capacity,
		}));
	}, [availability, selectedDate, selectedOption]);

	return (
		<>
			<MetaDetails
				metaTitle={(tour.meta_details?.meta_title ?? tour.name) + " | WanderNest"}
				metaDescription={tour.meta_details?.meta_description ?? tour.overview?.slice(0, 320)}
				metaKeywords={tour.meta_details?.meta_keywords ?? tour.name}
				canonicalUrl={metaUrl}
				ogUrl={metaUrl}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.cover_image}
				ogType="product"
				hasPricing
				pricing={{
					price:
						tour.tour_options && tour.tour_options.length > 0
							? Math.min(...tour.tour_options.map(getMinPrice)).toString()
							: "-",
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getStructuredData(tour)),
				}}
			/>
			<section>
				<div className="pb-4 space-y-8">
					{/* Header */}
					<div className="space-y-2">
						<div className="flex gap-2 justify-between">
							<h1 className="text-3xl font-bold text-pretty">{tour.name}</h1>
							<div className="max-lg:hidden flex gap-2">
								<AddToFavouriteBtn tour_id={tour.id} />
								<ShareDialog
									url={`${process.env.VITE_MAIN_APP_URL}/tours/tour/${tour.id}/${tour.meta_details?.url_key}`}
								/>
							</div>
						</div>
						<div className="flex sm:gap-4 gap-2 flex-wrap items-center">
							{tour.tour_category && (
								<>
									<Link
										to={`/tours?categories=${tour.tour_category.id}`}
										viewTransition
										prefetch="intent"
									>
										<div>
											<p className="text-sm text-muted-foreground">
												{tour.tour_category.name}
											</p>
										</div>
									</Link>
								</>
							)}
							{tour.provider && (
								<span className="h-fit min-w-fit text-muted-foreground">•</span>
							)}
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
								<div className="lg:inline hidden">
									<TourImageCarousel images={tour_images} />
								</div>
								<div className="inline lg:hidden">
									<TourImageCarousel images={tour_images} thumbPosition="bottom" />
								</div>
							</div>
							<section className="lg:hidden">
								<AttributesCard tour={tour} />
							</section>
							<div className="space-y-8">
								{/* Tour Options */}
								<div className="space-y-4" id="tour-options">
									<h2 className="text-2xl font-semibold">Available Options</h2>
									{tour.tour_options
										.sort((a, b) => (a.sort_order ?? 1) - (b.sort_order ?? 1))
										.map((option, idx) => (
											<Card key={option.id} className="pt-0" id={"tour-option-" + idx}>
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
															<h2 className="text-lg font-semibold">
																Inclusions:
															</h2>
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
															<h2 className="text-lg font-semibold">
																Exclusions:
															</h2>
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
												</CardContent>
												<Separator />
												<CardContent>
													<div>
														<p className="text-muted-foreground">
															From {getMinPrice(option)} AED
														</p>
														{getUpcomingAvailableDates(option, 3).length == 0 &&
															((option.availability_rules ?? []).every((a) =>
																(a.time_slots ?? []).every(
																	(s) =>
																		availability.find(
																			(a) => a.id === s.id,
																		)?.available_seats,
																),
															) ||
																option.availability_rules.length == 0) && (
																<p className="text-destructive">
																	Not Available
																</p>
															)}

														{(() => {
															const upcomingDates = getUpcomingAvailableDates(
																option,
																isMobile ? 3 : 6,
															);

															if (
																upcomingDates.length === 0 ||
																upcomingDates.length < 3 ||
																tour.tour_options.every(
																	(i) => i.isOpenDated === true,
																)
															) {
																return <></>;
															}

															return (
																<div className="mt-2 space-y-2">
																	<h2 className="text-muted-foreground text-xs">
																		Next Available Dates
																	</h2>
																	<div className="flex flex-wrap gap-2">
																		{upcomingDates.map(
																			({ date, formatted }) => (
																				<div
																					key={formatted}
																					className="cursor-pointer hover:bg-primary/10 transition-colors py-4 px-5 flex flex-col gap-1 items-center justify-center bg-muted rounded-lg"
																					onClick={() => {
																						handleDateSelect(
																							date,
																						);
																						handleButtonClick(
																							option,
																						);
																					}}
																				>
																					<Calendar className="w-4 h-4 text-muted-foreground" />
																					<div className="text-center">
																						<p className="text-sm">
																							{formatted.split(
																								" ",
																							)[0] +
																								" " +
																								formatted.split(
																									" ",
																								)[1]}
																						</p>
																						<p className="text-[0.7rem]">
																							{
																								formatted.split(
																									" ",
																								)[2]
																							}
																						</p>
																					</div>
																				</div>
																			),
																		)}
																		{upcomingDates.length ===
																			(isMobile ? 3 : 6) && (
																			<div
																				className="cursor-pointer hover:bg-primary/10 transition-colors py-4 px-5 flex flex-col gap-1 items-center justify-center bg-muted rounded-lg text-sm"
																				onClick={() =>
																					handleButtonClick(option)
																				}
																			>
																				<CalendarPlusIcon className="w-4 h-4 text-muted-foreground" />
																				<p className="text-sm">
																					More
																				</p>
																			</div>
																		)}
																	</div>
																</div>
															);
														})()}
													</div>
												</CardContent>
												{getUpcomingAvailableDates(option, 6).length > 3 &&
													tour.tour_options.every(
														(i) => i.isOpenDated === false,
													) && <Separator />}
												<CardContent>
													<div className="flex gap-4 flex-wrap mt-6">
														{/* View Details Dialog */}
														<Dialog>
															<DialogTrigger asChild>
																<Button variant={"outline"} size={"sm"}>
																	View Details
																</Button>
															</DialogTrigger>
															<DialogContent className="max-w-xl max-h-[min(600px,80vh)] overflow-y-auto">
																<DialogHeader className="mb-2">
																	<DialogTitle>Option Details</DialogTitle>
																</DialogHeader>
																<div className="bg-accent p-4 rounded-lg">
																	<h3 className="font-semibold text-base">
																		{tour.name}
																	</h3>
																	<p className="text-sm">{option.name}</p>
																</div>
																<div>
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
																	<div className="flex gap-2 justify-between items-center pt-6 pb-2 border-t mt-5">
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
																const newUrl = new URL(window.location.href);
																newUrl.searchParams.delete("optionId");
																newUrl.searchParams.delete("date");
																window.history.replaceState(
																	{},
																	"",
																	newUrl.toString(),
																);
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
																<div className="bg-accent p-4 rounded-lg space-y-2">
																	<h3 className="font-semibold text-base">
																		{tour.name}
																	</h3>
																	<div className="space-y-1">
																		{selectedOption && (
																			<p className="text-sm">
																				{selectedOption.name}
																			</p>
																		)}
																		{step === "time" && selectedDate && (
																			<div className="flex gap-2 items-center justify-between">
																				<p className="text-sm mt-1">
																					{format(
																						selectedDate,
																						"PPPP",
																					)}
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
																				<div className="space-y-1">
																					<p className="text-sm">
																						{format(
																							selectedDate,
																							"PPPP",
																						)}
																					</p>
																					<div className="flex gap-2 items-center justify-between">
																						<p className="text-sm">
																							{
																								selectedTimeSlot.label
																							}
																						</p>
																						<button
																							type="button"
																							onClick={
																								handleBack
																							}
																							className="cursor-pointer flex gap-2"
																						>
																							<Edit className="w-4 h-4 " />
																							<span className="text-sm">
																								Edit TimeSlot
																							</span>
																						</button>
																					</div>
																					{availability.length >
																						0 && (
																						<p className="text-sm">
																							{
																								availability.find(
																									(a) =>
																										a.id ===
																										selectedTimeSlot.id,
																								)
																									?.available_seats
																							}{" "}
																							seat(s) available
																						</p>
																					)}
																				</div>
																			)}
																	</div>
																</div>
																{step === "date" && selectedOption && (
																	<div className="space-y-4">
																		<p>
																			Select{" "}
																			{selectedOption?.isOpenDated
																				? "your preffered date"
																				: "a date"}
																		</p>
																		{[
																			{
																				className:
																					"max-[32rem]:hidden",
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
																			(
																				{ className, months, align },
																				i,
																			) => (
																				<div
																					className={className}
																					key={i}
																				>
																					<DatePicker
																						popover_align={
																							align as any
																						}
																						numberOfMonths={
																							months
																						}
																						value={selectedDate}
																						onDateChange={
																							handleDateSelect
																						}
																						defaultMonth={
																							selectedDate ||
																							new Date()
																						}
																						date_disabled={(
																							date,
																						) => {
																							if (
																								isBefore(
																									date,
																									startOfToday(),
																								)
																							)
																								return true;

																							return !isDateCoveredByAnyRule(
																								date,
																								selectedOption,
																							);
																						}}
																					/>
																				</div>
																			),
																		)}
																		{selectedDate &&
																			getTimeSlotsForDate(
																				selectedDate,
																				selectedOption,
																			).length === 0 && (
																				<p className="text-destructive">
																					No available time slots
																					for this date.
																				</p>
																			)}
																		<div className="w-fit ml-auto">
																			<Button
																				size={"sm"}
																				onClick={handleDateNextClick}
																				disabled={
																					(selectedDate &&
																						getTimeSlotsForDate(
																							selectedDate,
																							selectedOption,
																						).length === 0) ||
																					!selectedDate
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
																				{isLoadingSlots ? (
																					<>
																						<Skeleton className="h-10 w-28 rounded-md" />
																						<Skeleton className="h-10 w-28 rounded-md" />
																						<Skeleton className="h-10 w-28 rounded-md" />
																					</>
																				) : (
																					updatedTimeSlots.map(
																						(slot) => {
																							const seats =
																								slot.capacity;
																							const disabled =
																								seats <= 0 ||
																								!slot.is_active;

																							return (
																								<Button
																									key={
																										slot.id
																									}
																									variant="secondary"
																									className={cn(
																										"w-fit min-w-25",
																										disabled
																											? "opacity-60 cursor-not-allowed pointer-events-none"
																											: "border-2 border-primary hover:bg-primary/10",
																									)}
																									onClick={() =>
																										handleTimeSelect(
																											slot,
																										)
																									}
																									disabled={
																										disabled
																									}
																								>
																									{
																										slot.label
																									}
																									{` (${seats})`}
																								</Button>
																							);
																						},
																					)
																				)}
																			</div>
																		</div>
																	)}
																{step === "participants" &&
																	selectedOption &&
																	selectedTimeSlot &&
																	selectedDate && (
																		<ParticipantFormComponent
																			option={selectedOption}
																			selectedTimeSlot={{
																				...selectedTimeSlot,
																				capacity:
																					selectedTimeSlot.capacity,
																			}}
																			selectedDate={selectedDate}
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
								<MainBodySection
									title="Know Before You Go"
									content={tour.know_before_you_go}
								/>
								<MainBodySection
									title="Age and Health Restrictions"
									content={tour.age_health_restrictions}
								/>
								{tour.cancellation_policy_detail &&
									tour.cancellation_policy_detail.policy && (
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
										<Suspense>
											<Await
												resolve={tour}
												children={(tour) =>
													tour.address_link && (
														<iframe
															src={tour.address_link}
															width="100%"
															height="400"
															style={{
																border: "0",
																borderRadius: "10px",
																marginTop: "1rem",
															}}
															allowFullScreen
															loading="lazy"
															referrerPolicy="no-referrer-when-downgrade"
														></iframe>
													)
												}
											/>
										</Suspense>
									</section>
								)}
							</div>
						</div>
						{/* Right side */}
						<section className="max-lg:hidden">
							<AttributesCard className="sticky top-10" tour={tour} />
						</section>
					</div>
					{tour.tags && tour.tags.length > 0 && (
						<section>
							<h2 className="text-2xl font-semibold">Related Tags</h2>
							<div className="flex gap-2 flex-wrap mt-4">
								{tour.tags.map((tag, i) => (
									<Link
										key={tag.id}
										viewTransition
										prefetch="intent"
										to={`/tours?tags=${tag.id}`}
									>
										<div className="relative">
											<div className="flex gap-2 items-center pr-6 bg-card rounded-md">
												<div className="px-4 bg-primary py-2 rounded-l-md">
													<p className="text-white">{i + 1}</p>
												</div>
												<p className="text-base py-2">{tag.name}</p>
											</div>
										</div>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			</section>
			{loaderData && (
				<Suspense fallback={<TourReviewsSkeleton />}>
					<Await
						resolve={loaderData.reviewsData}
						children={(reviewsData) => (
							<section className="py-20">
								<TourReviews
									reviews={reviewsData.reviews}
									average_rating={reviewsData.stats.average_rating}
									total_reviews={reviewsData.stats.total_reviews}
									rating_counts={reviewsData.stats.rating_counts}
									currentPage={loaderData.currentReviewPage}
									hasMore={reviewsData.reviews.length === REVIEWS_PAGE_SIZE}
								/>
							</section>
						)}
					/>
				</Suspense>
			)}
			<section className="py-20 space-y-10">
				<section>
					<RelatedTours
						tours={loaderData?.relatedToursByCity ?? []}
						title={"Exlore More in " + tour.city?.name}
					/>
				</section>
				<section>
					<RelatedTours
						tours={loaderData?.relatedToursByCategory ?? []}
						title={"See Related Tours"}
					/>
				</section>
			</section>
		</>
	);
}

const ParticipantFormComponent = memo(
	({
		option,
		selectedTimeSlot,
		selectedDate,
	}: {
		option: TourDetailOption;
		selectedTimeSlot: AvailabilitySlot;
		selectedDate: Date;
	}) => {
		const navigate = useNavigate();
		const loaderData = useLoaderData<typeof loader>();

		const { control, handleSubmit, getValues } = useForm<ParticipantForm>({
			resolver: zodResolver(participantSchema),
			defaultValues: {
				quantities: option.prices.reduce((acc: Record<number, number>, price) => {
					acc[price.participant_type.id] = 0;
					return acc;
				}, {}),
			},
		});

		const quantities = useWatch({ control, name: "quantities" });
		const [isAddingToCart, setIsAddingToCart] = useState(false);

		function calculatePrice() {
			return Object.entries(quantities).reduce((sum, [typeId, qty]) => {
				const price =
					option.prices.find((p: any) => p.participant_type.id === Number(typeId))?.price || 0;
				return sum + price * (Number(qty) || 0);
			}, 0);
		}

		const totalPrice = useMemo(() => calculatePrice(), [quantities, option]);

		const onSubmit = (data: ParticipantForm) => {
			if (loaderData == null || loaderData?.tour == null) {
				toast.error("Something went wrong. Please try again.");
			}

			if (Object.values(data.quantities).some((qty) => qty > 0) === false) {
				toast.error("Please select at least one participant.");
				return;
			}

			let availability_slots = loaderData?.availability;
			if (availability_slots && availability_slots.length > 0) {
				const available_seats =
					availability_slots.find((slot) => slot.id === selectedTimeSlot.id)?.available_seats ||
					selectedTimeSlot.capacity;

				let input_qty = 0;
				for (const key in data.quantities) {
					key in data.quantities && (input_qty += data.quantities[key]);
				}

				if (input_qty > available_seats) {
					toast.error(
						`There ${available_seats <= 1 ? "is" : "are"} only ${available_seats} available seat(s) for this time slot. Please select a different time slot or reduce the number of participants.`,
					);

					return;
				}
			}

			navigate("/booking", {
				state: {
					tour: loaderData?.tour,
					option,
					date: selectedDate,
					timeSlot: selectedTimeSlot,
					quantities: data.quantities,
				},
			});
		};

		const handleAddToCart = async () => {
			const currentQuantities = getValues("quantities");
			const userId = loaderData?.userData.user?.id;

			if (!userId) {
				toast.error("Please login to add to cart.");
				return;
			}

			setIsAddingToCart(true);

			try {
				const payload: AddToCartPayload = {
					user_id: userId,
					cart_items: [
						{
							tour_option_id: option.id,
							preferred_date: format(selectedDate, "yyyy-MM-dd"),
							preferred_timeslot: selectedTimeSlot.label,
							quantities: Object.entries(currentQuantities)
								.filter(([, qty]) => qty > 0)
								.map(([participant_type_id, quantity]) => ({
									participant_type_id: Number(participant_type_id),
									quantity: Number(quantity),
								})),
						},
					],
				};

				const res = await fetch("/add-to-cart", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const json = await res.json();

				if (json.success) {
					toast.success("Added to cart successfully!", {
						action: {
							label: "Go to cart",
							onClick: () => {
								navigate("/cart", {
									viewTransition: true,
								});
							},
						},
					});
				} else {
					toast.error(json.error || "Failed to add to cart");
				}
			} catch (error) {
				toast.error("Failed to add to cart");
				console.error(error);
			} finally {
				setIsAddingToCart(false);
			}
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
													{pt.age_max - pt.age_min > 80 ? (
														<p>({pt.age_min}+)</p>
													) : pt.age_max === 0 && pt.age_min === 0 ? (
														<></>
													) : (
														<p>
															({pt.age_min}-{pt.age_max})
														</p>
													)}
												</div>
											</Label>
										</div>
										<p className="text-sm">{price.price} AED</p>
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
													max={selectedTimeSlot.capacity}
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

				<div className="flex gap-3 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleAddToCart}
						disabled={isAddingToCart || Object.values(quantities).every((q) => q === 0)}
					>
						{isAddingToCart ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<BadgePlus className="h-4 w-4" />
						)}
						<p className="my-auto">Add to Cart</p>
					</Button>

					<Button type="submit">Book Now</Button>
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
		const loaderData = useLoaderData<typeof loader>();

		return (
			<Card className={cn("h-fit", className)}>
				<CardContent className="space-y-4">
					<div className="flex flex-col justify-center">
						<h2 className="text-xl font-semibold">
							From {Math.min(...tour.tour_options.map(getMinPrice))} AED
						</h2>
						<p className="text-muted-foreground text-sm">
							Per{tour.hasGroupPrice ? " Group" : " Person"}
						</p>
					</div>
				</CardContent>
				{(tour.free_cancelation_avilable !== null ||
					tour.duration_minutes !== null ||
					tour.live_tour_guide !== null ||
					(tour.live_tour_guide_langs !== null && tour.live_tour_guide_langs !== "")) && (
					<Separator />
				)}
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
									Duration around {formatTourDurationHours(tour.duration_minutes)}
								</h3>
								<p className="text-muted-foreground text-sm">
									Check availability or contact us for starting times
								</p>
							</div>
						</div>
					)}
					{tour.isWeelChairAccessible && (
						<div className="flex items-center gap-4">
							<Accessibility className="h-5 w-5" />
							<div>
								<h3 className="font-semibold">Accessibility</h3>
								<p className="text-muted-foreground text-sm">
									{tour.name} tour is wheelchair accessible
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
										Languages include{" "}
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

					<a
						href={`https://wa.me/${CONTACT_NUMBER_1}?text=${encodeURIComponent(`Hi, I want to know more about the ${tour.name} tour availability.`)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button className="w-full mt-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="36"
								height="36"
								fill="#ffff"
							>
								<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23c-1.48 0-2.93-.39-4.19-1.15l-.3-.17l-3.12.82l.83-3.04l-.2-.32a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31c-.22.25-.87.86-.87 2.07c0 1.22.89 2.39 1 2.56c.14.17 1.76 2.67 4.25 3.73c.59.27 1.05.42 1.41.53c.59.19 1.13.16 1.56.1c.48-.07 1.46-.6 1.67-1.18s.21-1.07.15-1.18c-.07-.1-.23-.16-.48-.27c-.25-.14-1.47-.74-1.69-.82c-.23-.08-.37-.12-.56.12c-.16.25-.64.81-.78.97c-.15.17-.29.19-.53.07c-.26-.13-1.06-.39-2-1.23c-.74-.66-1.23-1.47-1.38-1.72c-.12-.24-.01-.39.11-.5c.11-.11.27-.29.37-.44c.13-.14.17-.25.25-.41c.08-.17.04-.31-.02-.43c-.06-.11-.56-1.35-.77-1.84c-.2-.48-.4-.42-.56-.43c-.14 0-.3-.01-.47-.01" />
							</svg>
							<span>Send Us A Message</span>
						</Button>
					</a>
				</CardContent>

				<Separator className="lg:hidden" />

				<CardContent className="flex justify-between flex-wrap gap-4">
					<Suspense fallback={<></>}>
						<Await
							resolve={loaderData?.reviewsData}
							children={(reviewsData) =>
								reviewsData?.stats.total_reviews &&
								reviewsData?.stats.total_reviews > 0 &&
								reviewsData?.stats.average_rating > 2 ? (
									<div className="flex items-center gap-2 lg:hidden">
										<div className="flex items-center">
											<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
											<span className="ml-1.5 text-xl font-semibold">
												{reviewsData.stats.average_rating.toFixed(1)}
											</span>
										</div>
										<span className="text-muted-foreground">
											· {reviewsData?.stats.total_reviews} reviews
										</span>
									</div>
								) : null
							}
						/>
					</Suspense>
					<div className="lg:hidden flex gap-2 ml-auto w-fit">
						<AddToFavouriteBtn tour_id={tour.id} />
						<ShareDialog
							url={`www.wandernest.com/tours/tour/${tour.id}/${tour.meta_details?.url_key}`}
						/>
					</div>
				</CardContent>
			</Card>
		);
	},
);

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

function AddToFavouriteBtn({ tour_id }: { tour_id: string }) {
	const { isFavourite, toggle } = useFavourites();
	const active = isFavourite(tour_id);

	return (
		<Button
			variant="ghost"
			type="button"
			className={`group hover:bg-destructive/40! ${active ? "bg-destructive/40!" : ""}`}
			onClick={() => toggle(tour_id)}
		>
			<Heart
				className={`h-4 w-4 group-hover:text-destructive group-hover:fill-destructive ${
					active ? "text-destructive fill-destructive" : ""
				}`}
			/>
			<span className="mt-1 max-[28rem]:hidden">
				{active ? "Remove from Favourites" : "Add To Favourites"}
			</span>
		</Button>
	);
}
