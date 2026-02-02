import { Loader2, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "@workspace/shared/utils/ui";
import { Button } from "~/components/ui/button";
import { TourReview } from "@workspace/shared/types/tour-reviews";
import ReviewCard from "~/components/Tour/ReviewCard";
import ReviewStats from "~/components/Tour/ReviewStats";
import { useNavigation, useSearchParams } from "react-router";
import TourReviewsFilters from "~/components/Tour/TourReviewFilters";
import { Skeleton } from "~/components/ui/skeleton";

interface TourReviewsProps {
	reviews: TourReview[];
	average_rating: number;
	total_reviews: number;
	rating_counts: Record<1 | 2 | 3 | 4 | 5, number>;
	currentPage: number;
	hasMore: boolean;
	className?: string;
}

export default function TourReviews({
	reviews,
	average_rating,
	total_reviews,
	rating_counts,
	currentPage,
	hasMore,
	className,
}: TourReviewsProps) {
	const hasReviews = total_reviews > 0;
	const [_, setSearchParams] = useSearchParams();
	const navigation = useNavigation();

	const handleLoadMore = () => {
		const nextPage = currentPage + 1;
		setSearchParams(
			(prev) => {
				prev.set("reviews_page", nextPage.toString());
				return prev;
			},
			{
				preventScrollReset: true,
				replace: true,
				state: { scrollPosition: window.scrollY },
			},
		);
	};

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	return (
		<section className={cn("space-y-8 py-12", className)} id="tour-reviews">
			<div className="flex items-center justify-between">
				<h2 className="section-heading">Customer Reviews</h2>
				{hasReviews && (
					<div className="flex items-center gap-2 max-sm:hidden">
						<div className="flex items-center">
							<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
							<span className="ml-1.5 text-xl font-semibold">{average_rating.toFixed(1)}</span>
						</div>
						<span className="text-muted-foreground">· {total_reviews} reviews</span>
					</div>
				)}
			</div>

			{hasReviews ? (
				<div className="grid lg:grid-cols-12 gap-8">
					{/* Stats - left column on desktop */}
					<div className="lg:col-span-4 space-y-4">
						<ReviewStats average={average_rating} total={total_reviews} counts={rating_counts} />
					</div>

					{/* Reviews list + FILTERS */}
					<div className="lg:col-span-8 space-y-6">
						<TourReviewsFilters />
						{/* <TourReviewsFilters /> */}
						<div className="space-y-4">
							{reviews.map((review) => (
								<ReviewCard key={review.id} review={review} />
							))}
							{hasMore && (
								<div className="text-center pt-8">
									<Button
										variant="outline"
										onClick={handleLoadMore}
										disabled={isFetchingThisRoute}
									>
										{isFetchingThisRoute && <Loader2 className="animate-spin" />}
										Load more reviews
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<Card className="bg-muted/40 shadow-none">
					<CardContent className="py-12 text-center ">
						<div className="mx-auto w-16 bg-yellow-300/50 h-16 rounded-full flex items-center justify-center mb-4">
							<StarOff className="h-8 w-8 text-yellow-400 " />
						</div>
						<h3 className="text-xl font-medium mb-2">No reviews yet</h3>
						<p className="text-muted-foreground max-w-md mx-auto">
							Be the first to share your experience with this tour! Book Tour and leave a
							review.
						</p>
					</CardContent>
				</Card>
			)}
		</section>
	);
}

export function TourReviewsSkeleton({ className }: { className?: string }) {
	return (
		<section className={cn("space-y-8 py-20", className)} id="tour-reviews">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-44" />
				<div className="hidden sm:flex items-center gap-2">
					<Skeleton className="h-5 w-5 rounded-sm" />
					<Skeleton className="h-6 w-12" />
					<Skeleton className="h-5 w-24" />
				</div>
			</div>

			<div className="grid lg:grid-cols-12 gap-8">
				{/* Left: ReviewStats (NO CARD wrapper) */}
				<Card className="lg:col-span-4 h-fit">
					<CardContent className=" space-y-6">
						<div className="text-center space-y-3">
							<Skeleton className="h-10 w-16 mx-auto" />
							<div className="flex justify-center gap-1">
								{Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className="h-4 w-4 rounded-sm" />
								))}
							</div>
							<Skeleton className="h-4 w-28 mx-auto" />
						</div>

						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center gap-3">
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-2 flex-1 rounded-full" />
									<Skeleton className="h-4 w-6" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Right: Filters + Reviews */}
				<div className="lg:col-span-8 space-y-6">
					{/* Filters */}
					<div className="ml-auto w-fit">
						<Skeleton className="h-10 w-32" />
					</div>

					{/* Reviews */}
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card key={i} className="border bg-card shadow-none">
								<CardContent className="p-6">
									<div className="flex sm:flex-row flex-col items-center gap-5">
										{/* Avatar */}
										<div className="shrink-0">
											<Skeleton className="h-14 w-14 rounded-full" />
										</div>

										{/* Content */}
										<div className="flex-1 space-y-3">
											<Skeleton className="h-4 w-full max-w-32" />
											<div className="flex items-center gap-2">
												{Array.from({ length: 5 }).map((_, j) => (
													<Skeleton key={j} className="h-4 w-4 rounded-sm" />
												))}
												<Skeleton className="h-4 w-4 rounded-sm" />
											</div>

											<div className="space-y-2">
												<Skeleton className="h-4 w-full" />
												<Skeleton className="h-4 w-3/6" />
											</div>

											<Skeleton className="h-3 w-24 sm:hidden" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Load more */}
					<div className="pt-8 text-center">
						<Skeleton className="h-10 w-40 mx-auto" />
					</div>
				</div>
			</div>
		</section>
	);
}
