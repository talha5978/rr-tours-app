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
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Loader2, Plus, Star } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";
import { queryClient } from "@workspace/shared/utils/query-client";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { myReviewsQuery } from "~/queries/reviews.q";
import AddReviewForm from "~/components/Tour/AddReviewForm";
import { Separator } from "~/components/ui/separator";
import { Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { authId, headers } = genAuthSecurity(request);
	let userId: string | null = null;

	if (authId) {
		const resp = await queryClient.fetchQuery(currentFullUserQuery({ request, authId, headers }));
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
		const result = await queryClient.fetchQuery(
			myReviewsQuery({ pageIndex, pageSize: PAGE_SIZE, request, userId }),
		);

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
	const [addReviewDialog, setAddReviewDialog] = useState(false);
	const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
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

	function handleDeleteClick(tour_id: string, review_id: string) {
		if (tour_id == null || review_id == null) {
			toast.error("Something went wrong!");
			return;
		}

		const formData = new FormData();
		formData.set("tour_id", tour_id);
		formData.set("review_id", review_id);
		fetcher.submit(formData, { method: "post", action: "/delete-review", preventScrollReset: true });
	}

	if (errorMessage) {
		return (
			<>
				<MetaDetails
					metaTitle="My Reviews | Top Attractions Dubai"
					metaDescription="See your reviews with us"
					metaKeywords="Top Attractions Dubai"
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
					metaTitle="My Reviews | Top Attractions Dubai"
					metaDescription="See your reviews with us"
					metaKeywords="Top Attractions Dubai"
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
				metaTitle="My Reviews | Top Attractions Dubai"
				metaDescription="See your reviews with us"
				metaKeywords="Top Attractions Dubai"
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
							<div className="p-4 bg-primary/5">
								<h3 className="font-semibold text-lg truncate">
									{booking.tour_name || "Tour"}
								</h3>
								<p className="text-sm text-muted-foreground truncate">
									{booking.tour_option_name || "Standard Option"}
								</p>
							</div>

							<div className="p-4 pt-2 space-y-4 flex-1">
								<div className="flex justify-between items-center text-sm">
									<div className="flex items-center gap-3">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<div className="flex flex-col">
											<span className="text-muted-foreground">
												{booking.confirmed_date || booking.preffered_date || "N/A"}
											</span>
											<span className="text-muted-foreground text-xs">
												{booking.confirmed_timeslot ||
													booking.preffered_timeslot ||
													"N/A"}
											</span>
										</div>
									</div>
									<Badge variant="outline" className="text-xs">
										{booking.booking_ref}
									</Badge>
								</div>

								<div className="flex flex-wrap gap-2">
									{booking.booking_status === "CONFIRMED" && (
										<Badge>
											<Check />
											Booking Confirmed
										</Badge>
									)}
									{(booking.payment_status === "PAID" ||
										booking.payment_status === "PARTIAL") && (
										<Badge
											variant={
												booking.payment_status === "PAID" ? "default" : "warning"
											}
										>
											<Check />
											{booking.payment_status === "PAID" ? "Paid" : "Partially Paid"}
										</Badge>
									)}
								</div>
							</div>

							<div className="p-4 border-t bg-muted/5">
								<div className="flex items-center justify-between mb-3">
									<h4 className="font-medium text-sm">
										Reviews ({booking.reviews.length}/5)
									</h4>
									{booking.reviews.length < 5 && (
										<Dialog
											open={addReviewDialog}
											onOpenChange={() => setAddReviewDialog(!addReviewDialog)}
										>
											<DialogTrigger onClick={() => setAddReviewDialog(true)}>
												<Button variant="ghost" size="icon">
													<Plus className="h-4 w-4" />
												</Button>
											</DialogTrigger>
											<DialogContent className="sm:max-w-md">
												<DialogHeader className="mt-6">
													<DialogTitle>
														Add Review for {booking.tour_name} - #
														{booking.booking_ref}
													</DialogTitle>
												</DialogHeader>
												<AddReviewForm
													booking_id={booking.id}
													tour_id={booking.tour_id!}
													setAddReviewDialog={() => setAddReviewDialog(false)}
												/>
											</DialogContent>
										</Dialog>
									)}
								</div>

								{booking.reviews.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center pb-2 pt-4">
										No reviews yet
									</p>
								) : (
									<div className="space-y-4 max-h-48 overflow-y-auto pr-2">
										{booking.reviews.map((review, index) => (
											<Fragment key={review.id}>
												<div className="space-y-2">
													<div className="flex justify-between items-center">
														<div className="flex items-center gap-2">
															<StarRating rating={review.rating} />
															<span className="text-xs text-muted-foreground">
																{format(
																	new Date(review.created_at),
																	"MMM dd, yyyy",
																)}
															</span>
														</div>
														<Dialog
															open={deletingReviewId === review.id}
															onOpenChange={(open) => {
																if (!open) setDeletingReviewId(null);
															}}
														>
															<DialogTrigger>
																<Button
																	variant={"link"}
																	size={"sm"}
																	className="p-0 m-0 text-destructive"
																	onClick={() =>
																		setDeletingReviewId(review.id)
																	}
																>
																	Delete
																</Button>
															</DialogTrigger>
															<DialogContent>
																<div className="mt-1">
																	<h2 className="font-bold text-xl">
																		Delete Review
																	</h2>
																	<p>
																		Are you sure you want to delete this
																		review?
																	</p>
																	<div className="mt-4 w-fit ml-auto flex gap-2 flex-row">
																		<Button
																			size="sm"
																			variant={"outline"}
																			onClick={() =>
																				setDeletingReviewId(null)
																			}
																			disabled={isDeletingReview}
																		>
																			Cancel
																		</Button>
																		<Button
																			size="sm"
																			className="text-destructive-foreground bg-destructive hover:bg-destructive"
																			onClick={() =>
																				handleDeleteClick(
																					booking.tour_id!,
																					review.id,
																				)
																			}
																			disabled={isDeletingReview}
																		>
																			{isDeletingReview && (
																				<Loader2 className="animate-spin" />
																			)}
																			Delete
																		</Button>
																	</div>
																</div>
															</DialogContent>
														</Dialog>
													</div>
													{review.comment && (
														<p className="text-sm text-muted-foreground line-clamp-3">
															{review.comment}
														</p>
													)}
												</div>
												<Separator
													hidden={
														booking.reviews.length === 1 ||
														index === booking.reviews.length - 1
													}
												/>
											</Fragment>
										))}
									</div>
								)}
							</div>

							<div className="p-4 border-t flex justify-end">
								<Link
									to={`/track-booking?ref=${booking.booking_ref}`}
									className="text-sm text-primary hover:underline flex items-center gap-1"
									viewTransition
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
