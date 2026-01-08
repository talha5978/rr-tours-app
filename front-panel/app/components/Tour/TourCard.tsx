import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import { Flame, MapPin, TicketX } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";

export const TourCard = memo(
	({ tour, className, ...props }: { tour: FP_HighLevelTour; className?: string }) => {
		return (
			<Link to={"/tours/tour/" + tour.id + "/" + tour.url_key} prefetch="intent" viewTransition>
				<div
					className={`h-full group overflow-hidden bg-card rounded-xl cursor-pointer ${className ?? ""}`}
					{...props}
				>
					<div className="relative overflow-hidden select-none">
						<img
							src={`${SUPABASE_IMAGE_BUCKET_PATH}/${tour.cover_image}`}
							alt={tour.name + " cover image"}
							title={tour.name + " cover image"}
							className="w-full h-48 object-cover transition-transform duration-300 ease-out group-hover:scale-[104%]"
						/>
						<div className="absolute bottom-2 left-3 z-20">
							<Badge>
								<MapPin />
								<p>{tour.city.name}</p>
							</Badge>
						</div>
					</div>
					<div className="p-4">
						<h3 className="font-bold text-lg line-clamp-2">{tour.name}</h3>
						<div className="mt-2 flex flex-col gap-2 flex-1">
							<div className="flex gap-2 flex-wrap">
								<Badge variant="outline">{tour.category.name}</Badge>
								{tour.toBeSoldOutScore === 1 ? (
									<div>
										<Badge className="bg-destructive">
											<TicketX />
											<span>Sold Out</span>
										</Badge>
									</div>
								) : tour.toBeSoldOutScore >= 0.7 ? (
									<div>
										<Badge className="bg-warning">
											<Flame />
											<span>Likely to Sell Out</span>
										</Badge>
									</div>
								) : null}
							</div>
							<div className="mt-auto">
								<p className="font-bold text-md">From {tour.price} AED</p>
								<p className="text-xs text-muted-foreground">Per Person</p>
							</div>
						</div>
					</div>
				</div>
			</Link>
		);
	},
);
