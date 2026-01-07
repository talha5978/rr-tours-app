import type { FPHighLevelCity } from "@workspace/shared/types/cities";
import { CityCard } from "~/components/Home/CityCard";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";

export default function CitiesSection({ cities }: { cities: FPHighLevelCity[] }) {
	return (
		<section className="sm:space-y-6 space-y-4">
			<h2 className="section-heading">Our Destinations</h2>
			<div className="hidden md:flex gap-4">
				{cities.map((city) => (
					<CityCard city={city} key={city.id} />
				))}
			</div>
			<Carousel className="w-full max-w-full md:hidden">
				<CarouselContent>
					{cities.map((city) => (
						<CarouselItem key={city.id} className="pl-4 basis-auto">
							<CityCard city={city} />
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</section>
	);
}
