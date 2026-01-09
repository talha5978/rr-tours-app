import { queryClient } from "@workspace/shared/utils/query-client";
import type { Route } from "../Home/+types/home";
import { toursQuery } from "~/queries/tours.q";
import { FPhighLevelCitiesQuery } from "~/queries/cities.q";
import FeaturedToursSection from "~/components/Home/FeaturedTours";
import CitiesSection from "~/components/Home/CItiesSection";
import WhyUsSection from "~/components/Home/WhyUsSection";
import { FPhighLevelCategoriesQuery } from "~/queries/categories.q";
import CategoriesSection from "~/components/Home/CategoriesSection";
import HeroSection from "~/components/Home/HeroSection";
import { allHeroSectionsQuery } from "@workspace/shared/queries/hero-sections.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const featuredToursResp = await queryClient.fetchQuery(
		toursQuery({ request, filters: { isFeatured: true } }),
	);
	const citiesResp = await queryClient.fetchQuery(FPhighLevelCitiesQuery({ request }));
	const categoriesResp = await queryClient.fetchQuery(FPhighLevelCategoriesQuery({ request }));
	const heroSectionsResp = await queryClient.fetchQuery(allHeroSectionsQuery({ request }));

	return { featuredToursResp, citiesResp, categoriesResp, heroSectionsResp };
};

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<MetaDetails
				metaTitle="Top Attractions Dubai | Book Unforgettable Tours & Experiences"
				metaDescription="Explore top destinations, book amazing tours, and enjoy unforgettable travel experiences. Easy booking, trusted operators, and great prices."
				metaKeywords="Top Attractions Dubai, Dubai Tours, Abu Dhabi Tours, UAE Tours, Burj Khalifa Tour, Dubai theme park tour, Dubai Mall, Al Ain City, Mesum of Future Tour, Dubai safari parks, National Aquarium Tour, Dubai Desert Safari Tour, Cruise Tours Dubai"
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}`}
				ogUrl={`${process.env.VITE_MAIN_APP_URL}`}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + loaderData.heroSectionsResp![0].image}
			/>
			<section className="pb-20 sm:space-y-16 space-y-8">
				<HeroSection hero_sections={loaderData.heroSectionsResp ?? []} />
				<FeaturedToursSection tours={loaderData.featuredToursResp.tours ?? []} />
				<CitiesSection cities={loaderData.citiesResp.data ?? []} />
				<WhyUsSection />
				<CategoriesSection categories={loaderData.categoriesResp.data ?? []} />
			</section>
		</>
	);
}
