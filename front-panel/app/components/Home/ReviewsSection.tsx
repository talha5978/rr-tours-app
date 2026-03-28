import { Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/components/ui/carousel";
import { cn } from "@workspace/shared/utils/ui";
import type { HomePageTourReview } from "@workspace/shared/types/tour-reviews";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";

interface ReviewsSectionProps {
	reviews: HomePageTourReview[];
	className?: string;
}

export default function ReviewsSection({ reviews, className }: ReviewsSectionProps) {
	if (!reviews?.length) return null;

	return (
		<section className={cn("container px-4 mx-auto md:px-6 py-16 md:py-20 bg-muted/30", className)}>
			<div className="text-center mb-10 md:mb-14">
				<h2 className="text-3xl md:text-4xl font-bold tracking-tight">What Our Travelers Say</h2>
				<p className="mt-3 text-lg text-muted-foreground">
					Real experiences from real people who explored attractions with us
				</p>
			</div>

			<div className="relative">
				<Carousel
					opts={{
						align: "start",
						dragFree: true,
					}}
					className="w-full"
				>
					<CarouselContent className="-ml-4">
						{reviews.map((review) => (
							<CarouselItem
								key={review.id}
								className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
							>
								<ReviewCard review={review} />
							</CarouselItem>
						))}
					</CarouselContent>

					{/* Custom centered arrows below carousel */}
					<div className="flex justify-center gap-4 mt-8">
						<CarouselPrevious
							variant="default"
							size="icon"
							className="relative static translate-y-0"
						>
							<ChevronLeft className="h-6 w-6" />
						</CarouselPrevious>

						<CarouselNext variant="default" size="icon" className="relative static translate-y-0">
							<ChevronRight className="h-6 w-6" />
						</CarouselNext>
					</div>
				</Carousel>
			</div>

			<div className="mt-12 text-center">
				<Link to={"/tours"} prefetch="intent" viewTransition>
					<Button size="lg" className="group">
						Explore Attractions
						<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
					</Button>
				</Link>
			</div>
		</section>
	);
}

function ReviewCard({ review }: { review: HomePageTourReview }) {
	return (
		<Card className="overflow-hidden cursor-pointer border bg-card shadow-sm hover:shadow-md transition-shadow h-full select-none">
			<CardContent className="p-6 flex flex-col h-full">
				<div className="flex items-center gap-3 mb-4">
					<Avatar className="h-8 w-8 border-2 border-background">
						<AvatarImage src={review.user?.avatar ?? undefined} alt={review.user?.full_name} />
						<AvatarFallback className="bg-primary/10 text-primary">
							{review.user?.full_name?.slice(0, 2).toUpperCase() ?? "?"}
						</AvatarFallback>
					</Avatar>

					<div className="flex-1 min-w-0">
						<h4 className="font-semibold leading-tight truncate">
							{review.user?.full_name ?? "Traveler"}
						</h4>
					</div>
				</div>

				<div className="flex mb-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							key={i}
							className={cn(
								"h-5 w-5",
								i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-yellow-400",
							)}
						/>
					))}
				</div>

				<p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4 mb-4">
					"{review.comment}"
				</p>

				<div className="text-xs text-muted-foreground mt-auto pt-4 border-t">
					<Link
						to={`/tours/tour/${review.tour.id}/${review.tour.url_key}`}
						prefetch="intent"
						viewTransition
					>
						<span className="font-medium hover:underline underline-offset-2">
							{review.tour.name}
						</span>
					</Link>
					<span className="mx-2">•</span>
					<span>
						{new Date(review.created_at).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
