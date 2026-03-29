import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import type { FrontPanelCoupon } from "@workspace/shared/types/coupons";
import { Heart, MapPin } from "lucide-react";
import { memo } from "react";
import { Link, type PrefetchBehavior } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useFavourites } from "~/utils/favourites.utils";

export const TourCard = memo(
	({
		tour,
		coupons = [],
		className,
		linkPrefetch = "intent",
		...props
	}: {
		tour: FP_HighLevelTour;
		coupons?: FrontPanelCoupon[];
		className?: string;
		linkPrefetch?: PrefetchBehavior;
	}) => {
		const { isFavourite, toggle } = useFavourites();
		const active = isFavourite(tour.id);

		const applicableCoupon = coupons.find((coupon) => {
			if (coupon.tours.length === 0) return true;
			return coupon.tours.some((t) => t.id === tour.id);
		});

		const hasDiscount = !!applicableCoupon;

		return (
			<div {...props} className="relative h-full">
				<Link
					to={"/tours/tour/" + tour.id + "/" + tour.url_key}
					prefetch={linkPrefetch}
					viewTransition
				>
					<div
						className={`h-full border-2 group overflow-hidden bg-card rounded-xl cursor-pointer ${className ?? ""}`}
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

							{hasDiscount && applicableCoupon.discount_type === "PERCENTAGE" && (
								<div className="absolute top-3 right-3 z-20">
									<Badge
										variant="destructive"
										className="font-semibold text-xs px-2.5 py-1 shadow"
									>
										{applicableCoupon.discount_value}% OFF
									</Badge>
								</div>
							)}
						</div>

						<div className="p-4">
							<h3 className="font-bold text-lg line-clamp-2">{tour.name}</h3>
							<div className="mt-2 flex flex-col gap-2 flex-1">
								<Badge variant="outline">{tour.category.name}</Badge>
								<div className="mt-auto">
									{/* Price Display with Discount */}
									<p className="font-bold text-md">From {tour.price} AED</p>
									{hasDiscount && applicableCoupon.discount_type === "FIXED_AMOUNT" && (
										<p className="text-xs text-muted-foreground mt-0.5">
											Save {applicableCoupon.discount_value} AED
										</p>
									)}

									<p className="text-xs text-muted-foreground">
										Per {tour.hasGroupPrice ? "Group" : "Person"}
									</p>
								</div>
							</div>
						</div>
					</div>
				</Link>
				<div className="absolute bottom-4 right-2 w-fit">
					<Button
						variant="ghost"
						size="icon"
						className={`group rounded-full group hover:bg-destructive/40! ${active ? "text-destructive fill-destructive hover:text-destructive hover:fill-destructive" : ""}`}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							toggle(tour.id);
						}}
					>
						<Heart
							className={`h-4 w-4 text-destructive group-hover:text-destructive group-hover:fill-destructive ${
								active ? "text-destructive fill-destructive" : ""
							}`}
						/>
					</Button>
				</div>
			</div>
		);
	},
);
