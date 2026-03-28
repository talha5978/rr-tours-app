import {
	Link,
	useLoaderData,
	useSearchParams,
	redirect,
	type LoaderFunctionArgs,
	useFetcher,
} from "react-router";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Plus, Star } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { myReviewsQuery } from "~/queries/reviews.q";
import AddReviewForm from "~/components/Tour/AddReviewForm";
import { Separator } from "~/components/ui/separator";
import { Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { authId } = genAuthSecurity(request);
	let userId: string | null = null;

	if (authId) {
		const resp = await getCurrentUser(request);
		userId = resp?.user?.id ?? null;
		if (userId === null) {
			return redirect("/login");
		}
	} else {
		return redirect("/login");
	}

	const url = new URL(request.url);
	const pageParam = url.searchParams.get("page");

	const currentPage = Number(pageParam) || 1;
	const pageIndex = Math.max(0, currentPage - 1);

	try {
		const result = await myReviewsQuery({ pageIndex, pageSize: PAGE_SIZE, request, userId });

		return {
			reviewsData: result,
			currentPage,
		};
	} catch (error) {
		console.error(error);
		return {
			reviewsData: { bookings: [], total: 0, error: null },
			currentPage,
			errorMessage: "Failed to load reviews. Please try again.",
		};
	}
};

const StarRating = ({ rating }: { rating: number }) => (
	<div className="flex">
		{[...Array(5)].map((_, i) => (
			<Star
				key={i}
				className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"}`}
			/>
		))}
	</div>
);

export default function MyReviewsPage() {
	const { reviewsData, currentPage, errorMessage } = useLoaderData<typeof loader>();

	const { bookings, total } = reviewsData;
	const totalPages = Math.ceil(total / PAGE_SIZE);
	const [addReviewBookingId, setAddReviewBookingId] = useState<string | null>(null);
	const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
	const [addReviewTourId, setAddReviewTourId] = useState<string | null>(null);
	const fetcher = useFetcher();
	const isDeletingReview = fetcher.state === "submitting" && fetcher.formAction === "/delete-review";

	const [_, setSearchParams] = useSearchParams();

	const handlePageChange = (newPage: number) => {
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.set("page", String(newPage));
				return newParams;
			},
			{ viewTransition: true, preventScrollReset: true, replace: true },
		);
	};

	useEffect(() => {
		if (fetcher.data && fetcher.data?.action === "DELETE_REVIEW") {
			if (fetcher.data.success) {
				toast.success("Review deleted successfully");
				setDeletingReviewId(null);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
	}, [fetcher.data]);

	function handleDeleteClick(tour_id: string, review_id: number) {
		if (tour_id == null || review_id == null) {
			toast.error("Something went wrong!");
			return;
		}
		setDeletingReviewId(review_id);
		const formData = new FormData();
		formData.set("tour_id", tour_id);
		formData.set("review_id", String(review_id));
		fetcher.submit(formData, { method: "post", action: "/delete-review", preventScrollReset: true });
	}

	if (errorMessage) {
		return (
			<>
				<MetaDetails
					metaTitle="My Reviews | WanderNest"
					metaDescription="See your reviews with us"
					metaKeywords="WanderNest"
				/>
				<div className="container mx-auto py-12 max-w-4xl">
					<Card>
						<CardHeader>
							<CardTitle>Something went wrong</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">{errorMessage}</p>
							<Button asChild className="mt-4">
								<Link to="/account/reviews" viewTransition prefetch="intent">
									Refresh
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	if (bookings.length === 0) {
		return (
			<>
				<MetaDetails
					metaTitle="My Reviews | WanderNest"
					metaDescription="See your reviews with us"
					metaKeywords="WanderNest"
				/>
				<div className="container mx-auto py-12 max-w-4xl">
					<Card>
						<CardHeader>
							<CardTitle>No reviews found</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">You haven't made any reviews yet.</p>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			<MetaDetails
				metaTitle="My Reviews | WanderNest"
				metaDescription="See your reviews with us"
				metaKeywords="WanderNest"
			/>
			<div className="min-w-full">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
					<p className="text-muted-foreground mt-1">
						View and manage your tour reviews on confirmed bookings
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{bookings.map((booking) => (
						<Card key={booking.id} className="flex flex-col overflow-hidden">
							{/* Booking header */}
							<div className="p-4 bg-primary/5">
								<h3 className="font-semibold text-lg">Booking #{booking.booking_ref}</h3>
							</div>

							<div className="p-4 flex-1 space-y-6">
								{/* Per-tour sections */}
								{booking.tours.map((tour) => (
									<div key={tour.tour_id} className="border rounded-lg p-4">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h4 className="font-medium">{tour.tour_name}</h4>
												{tour.tour_option_name && (
													<p className="text-sm text-muted-foreground">
														{tour.tour_option_name}
													</p>
												)}
											</div>
											<Badge variant="outline" className="text-xs">
												{tour.confirmed_date ? "Confirmed" : "Preferred"}
											</Badge>
										</div>

										<div className="text-sm text-muted-foreground mb-4">
											Confirmed:{" "}
											{tour.confirmed_date
												? format(new Date(tour.confirmed_date), "PPP")
												: "—"}{" "}
											• {tour.confirmed_timeslot || "—"}
											<br />
											Preferred:{" "}
											{tour.preffered_date
												? format(new Date(tour.preffered_date), "PPP")
												: "—"}{" "}
											• {tour.preffered_timeslot || "—"}
										</div>

										{/* Reviews for this tour */}
										{tour.reviews.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-6">
												No reviews yet
											</p>
										) : (
											<div className="space-y-4">
												{tour.reviews.map((review, idx) => (
													<Fragment key={review.id}>
														<div className="space-y-2">
															<div className="flex justify-between">
																<StarRating rating={review.rating} />
																<span className="text-xs text-muted-foreground">
																	{format(
																		new Date(review.created_at),
																		"MMM dd, yyyy",
																	)}
																</span>
															</div>
															{review.comment && (
																<p className="text-sm">{review.comment}</p>
															)}
															<div className="mt-1 flex justify-end">
																<Button
																	variant={"link"}
																	size={"sm"}
																	className="text-destructive px-0"
																	onClick={() =>
																		handleDeleteClick(
																			tour.tour_id,
																			review.id,
																		)
																	}
																	disabled={
																		isDeletingReview &&
																		deletingReviewId == review.id
																	}
																>
																	{isDeletingReview &&
																		deletingReviewId === review.id && (
																			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																		)}
																	Delete
																</Button>
															</div>
														</div>
														{idx < tour.reviews.length - 1 && <Separator />}
													</Fragment>
												))}
											</div>
										)}

										{/* Add review button per tour */}
										{tour.reviews.length < 5 && (
											<Dialog
												open={
													addReviewBookingId === booking.id &&
													addReviewTourId === tour.tour_id
												}
												onOpenChange={(open) => {
													if (!open) {
														setAddReviewBookingId(null);
														setAddReviewTourId(null);
													}
												}}
											>
												<DialogTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="w-full mt-4"
														onClick={() => {
															setAddReviewBookingId(booking.id);
															setAddReviewTourId(tour.tour_id);
														}}
													>
														<Plus className="mr-2 h-4 w-4" />
														Add Review for this tour
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Add Review — {tour.tour_name} (#
															{booking.booking_ref})
														</DialogTitle>
													</DialogHeader>
													<AddReviewForm
														booking_id={booking.id}
														tour_id={tour.tour_id}
														setAddReviewDialog={() => {
															setAddReviewBookingId(null);
															setAddReviewTourId(null);
														}}
													/>
												</DialogContent>
											</Dialog>
										)}
									</div>
								))}
							</div>

							<div className="p-4 border-t flex justify-end">
								<Link
									to={`/track-booking?ref=${booking.booking_ref}`}
									className="text-sm text-primary hover:underline flex items-center gap-1"
								>
									View Booking <ArrowRight className="h-3 w-3" />
								</Link>
							</div>
						</Card>
					))}
				</div>

				{totalPages > 1 && (
					<div className="mt-10 flex justify-center items-center gap-4">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onClick={() => handlePageChange(currentPage - 1)}
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							Previous
						</Button>

						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>

						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages}
							onClick={() => handlePageChange(currentPage + 1)}
						>
							Next
							<ChevronRight className="ml-1 h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</>
	);
}
