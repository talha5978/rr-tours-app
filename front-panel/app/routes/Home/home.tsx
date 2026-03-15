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
import { InquiryBanner } from "~/components/Contact/InquirySection";
import { homeTourReviewsQuery } from "~/queries/reviews.q";
import ReviewsSection from "~/components/Home/ReviewsSection";
import { useEffect } from "react";
import { toast } from "sonner";
import { collectionsQuery } from "~/queries/collections.q";
import CollectionsSection from "~/components/Collections/CollectionsSection";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const featuredToursResp = await queryClient.fetchQuery(
		toursQuery({ request, filters: { isFeatured: true } }),
	);
	const citiesResp = await queryClient.fetchQuery(FPhighLevelCitiesQuery({ request }));
	const categoriesResp = await queryClient.fetchQuery(FPhighLevelCategoriesQuery({ request }));
	const heroSectionsResp = await queryClient.fetchQuery(allHeroSectionsQuery({ request }));
	const reviewsResp = await queryClient.fetchQuery(homeTourReviewsQuery({ request }));
	const featuredCollectionsResp = await queryClient.fetchQuery(
		collectionsQuery({ request, isFeatured: true, cityId: null, pageIndex: 0, pageSize: 10 }),
	);

	const errors = decodeURIComponent(new URLSearchParams(request.url.split("?")[1]).get("error") || "");
	const success_msg = decodeURIComponent(
		new URLSearchParams(request.url.split("?")[1]).get("success") || "",
	);
	const payment_intent = decodeURIComponent(
		new URLSearchParams(request.url.split("?")[1]).get("payment_intent") || "",
	);
	const payment_intent_client_secret = decodeURIComponent(
		new URLSearchParams(request.url.split("?")[1]).get("payment_intent_client_secret") || "",
	);
	const redirect_status = decodeURIComponent(
		new URLSearchParams(request.url.split("?")[1]).get("redirect_status") || "",
	);

	return {
		featuredToursResp,
		citiesResp,
		categoriesResp,
		heroSectionsResp,
		reviewsResp,
		featuredCollectionsResp,
		errors,
		success_msg,
		payment_intent,
		payment_intent_client_secret,
		redirect_status,
	};
};

export default function Home({ loaderData }: Route.ComponentProps) {
	useEffect(() => {
		if (loaderData.errors != null && loaderData.errors !== "" && typeof window !== "undefined") {
			toast.error(loaderData.errors);
			const searchParams = new URLSearchParams(window.location.search);
			searchParams.delete("error");
			const newRelativePathQuery =
				window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
			window.history.replaceState(null, "", newRelativePathQuery);
		}
		if (
			loaderData.success_msg != null &&
			loaderData.success_msg !== "" &&
			typeof window !== "undefined"
		) {
			toast.success(loaderData.success_msg);
			const searchParams = new URLSearchParams(window.location.search);
			searchParams.delete("success");
			const newRelativePathQuery =
				window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
			window.history.replaceState(null, "", newRelativePathQuery);
		}

		if (
			loaderData.redirect_status === "succeeded" &&
			loaderData.payment_intent != null &&
			loaderData.payment_intent_client_secret != null
		) {
			toast.success("Payment Successful! Booking placed successfully.");
			const searchParams = new URLSearchParams(window.location.search);
			searchParams.delete("redirect_status");
			searchParams.delete("payment_intent");
			searchParams.delete("payment_intent_client_secret");
			const newRelativePathQuery =
				window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
			window.history.replaceState(null, "", newRelativePathQuery);
		}
	}, [loaderData]);

	return (
		<>
			<MetaDetails
				metaTitle="WanderNest | Book Unforgettable Tours & Experiences"
				metaDescription="Explore top destinations, book amazing tours, and enjoy unforgettable travel experiences. Easy booking, trusted operators, and great prices."
				metaKeywords="WanderNest, Dubai Tours, Abu Dhabi Tours, UAE Tours, Burj Khalifa Tour, Dubai theme park tour, Dubai Mall, Al Ain City, Mesum of Future Tour, Dubai safari parks, National Aquarium Tour, Dubai Desert Safari Tour, Cruise Tours Dubai"
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}`}
				ogUrl={`${process.env.VITE_MAIN_APP_URL}`}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + loaderData.heroSectionsResp![0].image}
			/>
			<section className="pb-20 sm:space-y-16 space-y-8">
				<HeroSection hero_sections={loaderData.heroSectionsResp ?? []} />
				<FeaturedToursSection tours={loaderData.featuredToursResp.tours ?? []} />
				<CitiesSection cities={loaderData.citiesResp.data ?? []} />
				<ReviewsSection reviews={loaderData.reviewsResp.reviews} />
				<WhyUsSection />
				<CollectionsSection title="Curated Collections" collections={loaderData.featuredCollectionsResp.collections ?? []} />
				<CategoriesSection categories={loaderData.categoriesResp.data ?? []} />
				<InquiryBanner />
			</section>	
		</>
	);
}
