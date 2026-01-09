import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import type { GetAllHeroSections } from "@workspace/shared/types/hero-sections";
import { Form, useSearchParams } from "react-router";

export default function HeroSection({ hero_sections }: { hero_sections: GetAllHeroSections }) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<section className="relative h-[80vh] w-full overflow-hidden rounded-xl">
			{/* Dark overlay */}
			<div className="absolute inset-0 bg-black/40 z-10 rounded-xl" />

			{/* Carousel */}
			<Carousel className="h-full w-full" plugins={[Autoplay({ delay: 7000 }), Fade({ active: true })]}>
				<CarouselContent className="h-full">
					{[...hero_sections].map((s) => (
						<CarouselItem key={s.id} className="h-[80vh] rounded-xl basis-full">
							<img
								src={`${SUPABASE_IMAGE_BUCKET_PATH}/${s.image}`}
								alt={s.name}
								title={s.name}
								className="h-full w-full object-cover object-center rounded-xl"
							/>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>

			{/* Overlay Text + Search */}
			<div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
				<h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
					Discover Your Next Adventure
				</h1>
				<p className="text-white text-md sm:text-lg md:text-xl mb-6 drop-shadow-md">
					Turn your travel dreams into unforgettable adventures.
				</p>

				{/* Search Input */}
				<Form method="get" action="/tours" className="min-w-full">
					<div className="flex flex-col min-[30rem]:flex-row gap-2 w-full max-w-xl mx-auto">
						<Input
							type="text"
							name="q"
							placeholder={"Search destinations, tours, or activities"}
							className="bg-white/90!"
							defaultValue={currentQuery}
						/>
						<Button className="w-full min-[30rem]:w-auto" type="submit">
							Search
						</Button>
					</div>
				</Form>
			</div>
		</section>
	);
}
