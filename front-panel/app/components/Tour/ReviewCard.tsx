import { formatDistanceToNow } from "date-fns";
import { Star, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "@workspace/shared/utils/ui";
import type { TourReview } from "@workspace/shared/types/tour-reviews";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

interface ReviewCardProps {
	review: TourReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
	const timeAgo = formatDistanceToNow(new Date(review.created_at), {
		addSuffix: true,
	});

	const initials =
		review.user?.full_name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() ?? "??";

	return (
		<Card className="overflow-hidden border bg-card shadow-sm">
			<CardContent className="pb-2">
				<div className="flex flex-col sm:flex-row items-center sm:items-start gap-0 sm:gap-6">
					<Avatar className="h-10 w-10 sm:h-12 sm:w-12 sm:mt-2 border-2 border-background ring-1 ring-muted/40">
						<AvatarImage src={review?.user?.avatar ?? undefined} alt={review.user?.full_name} />
						<AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-center sm:items-start min-w-0 w-full">
						<h3 className="mt-3 text-base font-semibold leading-tight text-center sm:text-left">
							{review.user?.full_name ?? "Anonymous"}
						</h3>
						<div className="flex-1 min-w-0 space-y-3">
							<div className="flex items-center gap-3 flex-wrap">
								<div className="flex">
									{Array.from({ length: 5 }).map((_, i) => (
										<Star
											key={i}
											className={cn(
												"h-4 w-4",
												i < review.rating
													? "fill-yellow-400 text-yellow-400"
													: "text-yellow-400",
											)}
										/>
									))}
								</div>

								{review.is_verified && (
									<Tooltip>
										<TooltipTrigger>
											<BadgeCheck className="h-5 w-5 text-primary shrink-0 cursor-pointer" />
										</TooltipTrigger>
										<TooltipContent>
											<p>Verified Customer</p>
										</TooltipContent>
									</Tooltip>
								)}
							</div>
						</div>
						<p className="text-sm text-foreground/90 mt-3 text-wrap">{review.comment}</p>
						<span className="text-xs text-muted-foreground mt-2 ml-auto">{timeAgo}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
