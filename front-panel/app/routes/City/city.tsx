import { queryClient } from "@workspace/shared/utils/query-client";
import { toursQuery } from "~/queries/tours.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import {
	fpDefaultTourSortByFilter,
	fpDefaultTourSortTypeFilter,
	SUPABASE_IMAGE_BUCKET_PATH,
} from "@workspace/shared/constants/constants";
import {
	Form,
	Link,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
	useSearchParams,
	type LoaderFunctionArgs,
} from "react-router";
import { cityDetailsQuery } from "~/queries/cities.q";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useMemo } from "react";
import { TourCard } from "~/components/Tour/TourCard";
import WhyUsSection from "~/components/Home/WhyUsSection";
import { CityTourSort } from "~/components/City/CitySort";
import { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import { MoveUpRight, SquareArrowOutUpRight } from "lucide-react";

const pageSize = 20;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) {
		throw new Response("City ID is required", { status: 400 });
	}

	const cityData = await queryClient.fetchQuery(cityDetailsQuery(request, parseInt(id)));

	const url = new URL(request.url);

	const sortBy = (url.searchParams.get("sortBy") as FPTourFilters["sortBy"]) || fpDefaultTourSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as FPTourFilters["sortType"]) || fpDefaultTourSortTypeFilter;

	const toursData = await queryClient.fetchQuery(
		toursQuery({
			request,
			filters: {
				cities: [id],
				sortBy: sortBy != "recommended" ? sortBy : undefined,
				sortType: sortBy != "recommended" ? sortType : undefined,
			},
			pageSize,
			q: url.searchParams.get("q")?.trim() ?? "",
		}),
	);

	return { toursData, cityData };
};

export default function CityPage() {
	const loaderData = useLoaderData<typeof loader>();
	const { cityData, toursData } = loaderData;
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	if (cityData.data == null || toursData.tours == null) {
		toast.error("Error fetching data!");
		navigate("/");
		return;
	}

	const subHeading = useMemo(() => getHeroSubHeading(), []);

	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const metaUrl =
		cityData?.data?.meta_details?.url_key != undefined
			? `${process.env.VITE_MAIN_APP_URL}/city/` +
				cityData?.data?.id +
				"/" +
				cityData?.data?.meta_details?.url_key
			: undefined;

	return (
		<>
			<MetaDetails
				metaTitle={cityData.data?.meta_details.meta_title + ` Tours | Top Attractions Dubai`}
				metaDescription={cityData.data?.meta_details.meta_description ?? ""}
				metaKeywords={cityData.data?.meta_details.meta_keywords ?? ""}
				canonicalUrl={metaUrl}
				ogUrl={metaUrl}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + cityData?.data?.full_image}
			/>
			<div className="pb-16 sm:space-y-16 space-y-8">
				<section className="relative h-[80vh] w-full overflow-hidden rounded-xl">
					{/* Dark overlay */}
					<div className="absolute inset-0 bg-black/40 z-10 rounded-xl" />
					<div className="h-[80vh] rounded-xl basis-full">
						<img
							src={`${SUPABASE_IMAGE_BUCKET_PATH}/${cityData?.data?.full_image}`}
							alt={cityData?.data?.name}
							title={cityData?.data?.name}
							className="h-full w-full object-cover object-center rounded-xl"
						/>
					</div>

					{/* Overlay Text + Search */}
					<div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
						<h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
							Explore Activites in {cityData.data.name}
						</h1>
						<p className="text-white text-md sm:text-lg md:text-xl mb-6 drop-shadow-md">
							{subHeading}
						</p>

						{/* Search Input */}
						<Form
							method="get"
							action={`/city/${cityData.data.id}/${cityData.data.meta_details.url_key}`}
							className="min-w-full"
						>
							<div className="flex flex-col min-[30rem]:flex-row gap-2 w-full max-w-xl mx-auto">
								<Input
									type="text"
									name="q"
									placeholder={"Search tours, or activities in " + cityData.data.name}
									className=" bg-white/90!"
									disabled={isFetchingThisRoute}
									defaultValue={currentQuery}
								/>
								<Button
									className="w-full min-[30rem]:w-auto"
									disabled={isFetchingThisRoute}
									type="submit"
								>
									Search
								</Button>
							</div>
						</Form>
					</div>
				</section>

				<section className="sm:space-y-6 space-y-4">
					<div className="flex gap-4 justify-between items-center flex-wrap">
						<h2 className="section-heading">Explore {cityData.data.name}</h2>
						<CityTourSort
							cityId={cityData.data.id}
							citySlug={cityData.data.meta_details.url_key}
						/>
					</div>

					{toursData.tours.length === 0 && (
						<div className="py-10">
							<p className="text-center text-muted-foreground">
								No tours found in {cityData.data.name}
							</p>
						</div>
					)}

					<ul className="grid gap-4 min-[28rem]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{toursData.tours.length > 0 &&
							toursData.tours.map((tour) => (
								<li key={tour.id}>
									<TourCard tour={tour} className="h-full" />
								</li>
							))}
					</ul>

					<div className="w-full flex items-center justify-center mt-10">
						<Link to={`/tours?cities=${cityData.data.id}`} prefetch="intent" viewTransition>
							<Button>
								<span>See More</span>
								<SquareArrowOutUpRight />
							</Button>
						</Link>
					</div>
				</section>

				<section className="mt-16">
					<WhyUsSection />
				</section>
			</div>
		</>
	);
}

function getHeroSubHeading() {
	const statements = [
		"Turn your travel dreams into unforgettable adventures.",
		"Embark on a journey that will leave you breathless.",
		"Explore the world and create memories that will last a lifetime.",
		"Discover hidden gems and experience the beauty of nature.",
		"Unleash your sense of adventure and challenge yourself to new heights.",
		"Immerse yourself in different cultures and learn from their traditions.",
		"Find solace in the tranquility of a peaceful retreat.",
		"Indulge in the flavors of local cuisine and savor the taste of adventure.",
		"Witness breathtaking sunrises and sunsets that will leave you in awe.",
		"Meet fascinating people and forge lifelong connections.",
		"Unravel the mysteries of ancient ruins and uncover the secrets of the past.",
		"Go off the beaten path and discover hidden treasures.",
		"Challenge yourself to try new activities and push your limits.",
		"Relax and rejuvenate in the serenity of a tranquil oasis.",
		"Capture the essence of a place and preserve it in your memories forever.",
	];

	return statements[Math.floor(Math.random() * statements.length)];
}
