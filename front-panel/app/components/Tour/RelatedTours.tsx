import type { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import { TourCard } from "~/components/Tour/TourCard";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRouteLoaderData } from "react-router";

export default function RelatedTours({ tours, title }: { tours: FP_HighLevelTour[]; title: string }) {
	const rootLoaderData = useRouteLoaderData("root");

	return (
		<section className="sm:space-y-6 space-y-4">
			<h2 className="section-heading">{title}</h2>

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
							className="pl-4 min-[550px]:basis-1/2 md:basis-1/3 lg:basis-1/4"
						>
							<TourCard tour={tour} coupons={rootLoaderData.couponsResp.coupons ?? []} />
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</section>
	);
}
