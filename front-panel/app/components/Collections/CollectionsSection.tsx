import type { FPCollection } from "@workspace/shared/types/collections";
import { TourCard } from "~/components/Tour/TourCard";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Link, useRouteLoaderData } from "react-router";
import { ArrowRight } from "lucide-react";
import type { FrontPanelCoupon } from "@workspace/shared/types/coupons";

export default function CollectionsSection({
	collections,
	title = "Curated Collections",
	isCity = false,
}: {
	collections: FPCollection[];
	title?: string;
	isCity?: boolean;
}) {
	if (collections.length === 0) return null;
	const rootLoaderData = useRouteLoaderData("root");

	return (
		<section className="py-12 bg-background">
			<div className="mx-auto space-y-14">
				<div className="mx-auto px-4 space-y-2">
					<h2 className="text-3xl font-bold text-center">{title}</h2>
					<p className="text-center text-muted-foreground">
						{!isCity
							? "🍀 Collections curated by WanderNest 🍀"
							: "Explore handpicked tours for your next adventure ❣️"}
					</p>
				</div>
				<div className="space-y-14">
					{collections.map((collection) => (
						<CollectionCarousel
							key={collection.id}
							collection={collection}
							coupons={rootLoaderData.couponsResp.coupons ?? []}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

function CollectionCarousel({
	collection,
	coupons,
	...props
}: {
	collection: FPCollection;
	coupons: FrontPanelCoupon[];
}) {
	const tours = collection.tours || [];

	return (
		<div {...props}>
			{/* Header */}
			<div className="flex justify-between items-center mb-1">
				<h3 className="text-2xl font-semibold max-sm:mx-auto">{collection.name}</h3>
				<Link
					to={`/collection/${collection.id}`}
					viewTransition
					prefetch="viewport"
					className="sm:flex hidden gap-1 items-center justify-center group text-primary"
				>
					View All
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all ease-in-out" />
				</Link>
			</div>
			{collection.description && (
				<p className="mb-4 text-muted-foreground max-sm:text-center">{collection.description}</p>
			)}

			<Carousel
				className="w-full max-w-full"
				plugins={[
					Autoplay({
						delay: 3000,
					}),
				]}
			>
				<CarouselContent>
					{tours.map((tour) => (
						<CarouselItem
							key={tour.id}
							title={tour.name}
							className="pl-4 min-[550px]:basis-1/2 md:basis-1/3 lg:basis-1/4"
						>
							<TourCard tour={tour} linkPrefetch="viewport" coupons={coupons ?? []} />
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>

			{tours.length === 0 && (
				<p className="text-center text-muted-foreground mt-4">
					No tours available in this collection yet.
				</p>
			)}
		</div>
	);
}
