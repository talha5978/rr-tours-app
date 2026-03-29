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
	useRouteLoaderData,
	useSearchParams,
	type LoaderFunctionArgs,
} from "react-router";
import { cityDetailsQuery } from "~/queries/cities.q";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { TourCard } from "~/components/Tour/TourCard";
import WhyUsSection from "~/components/Home/WhyUsSection";
import { TourSort } from "~/components/Tour/TourSort";
import { type FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import { SquareArrowOutUpRight } from "lucide-react";
import { cityTagsQuery } from "~/queries/tags.q";
import { InquiryBanner } from "~/components/Contact/InquirySection";
import { collectionsQuery } from "~/queries/collections.q";
import CollectionsSection from "~/components/Collections/CollectionsSection";

const pageSize = 20;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) {
		throw new Response("City ID is required", { status: 400 });
	}

	const cityData = await cityDetailsQuery({ request, cityId: Number(id) });

	const url = new URL(request.url);

	const sortBy = (url.searchParams.get("sortBy") as FPTourFilters["sortBy"]) || fpDefaultTourSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as FPTourFilters["sortType"]) || fpDefaultTourSortTypeFilter;

	const toursData = await toursQuery({
		request,
		filters: {
			cities: [id],
			sortBy: sortBy != "recommended" ? sortBy : undefined,
			sortType: sortBy != "recommended" ? sortType : undefined,
		},
		pageSize,
		q: url.searchParams.get("q")?.trim() ?? "",
	});

	const collectionsResp = await collectionsQuery({
		request,
		isFeatured: false,
		cityId: Number(id),
		pageIndex: 0,
		pageSize: 10,
	});

	const cityTags = await cityTagsQuery({ request, cityId: Number(id) });

	return { toursData, cityData, cityTags, collectionsResp };
};

export default function CityPage() {
	const loaderData = useLoaderData<typeof loader>();
	const rootLoaderData = useRouteLoaderData("root");
	const { cityData, toursData, cityTags } = loaderData;
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	if (cityData.data == null || toursData.tours == null) {
		toast.error("Error fetching data!");
		navigate("/");
		return;
	}

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
				metaTitle={cityData.data?.meta_details.meta_title + ` Tours | WanderNest`}
				metaDescription={cityData.data?.meta_details.meta_description ?? ""}
				metaKeywords={cityData.data?.meta_details.meta_keywords ?? ""}
				canonicalUrl={metaUrl}
				ogUrl={metaUrl}
				ogImage={SUPABASE_IMAGE_BUCKET_PATH + "/" + cityData?.data?.full_image}
			/>
			<div className="pb-20 sm:space-y-16 space-y-8">
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
							{"Explore Activites in "}
							<span className="inset-0 bg-primary/80 bg-opacity-30 px-2 rounded-sm text-pretty">
								{cityData.data.name}
							</span>
						</h1>
						<p className="text-white text-md sm:text-lg md:text-xl mb-6 drop-shadow-md">
							Turn your travel dreams into unforgettable adventures.
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

				{cityTags.length > 0 && (
					<section className="sm:space-y-6 space-y-4 bg-accent/50 px-4 rounded-lg py-10">
						<h2 className="section-heading mx-auto w-fit">More Activities</h2>
						<div className=" flex gap-4 flex-wrap justify-center">
							{cityTags.map((tag) => (
								<Link
									key={tag.id}
									prefetch="viewport"
									viewTransition
									to={`/tours?cities=${cityData?.data?.id}&tags=${tag.id}`}
								>
									<div className="w-42.5 h-full px-6 py-4 flex flex-col gap-3 items-center justify-center bg-card rounded-lg shadow-xs border-2">
										<img
											src={SUPABASE_IMAGE_BUCKET_PATH + "/" + tag.image}
											alt={tag.name}
											title={tag.name}
											className="w-7 h-7"
										/>
										<h3 className="text-center">{tag.name}</h3>
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				<section className="sm:space-y-6 space-y-4">
					<div className="flex gap-4 justify-between items-center flex-wrap">
						<h2 className="section-heading">Explore {cityData.data.name}</h2>
						<TourSort url={`/city/${cityData.data.id}/${cityData.data.meta_details.url_key}`} />
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
									<TourCard
										linkPrefetch="viewport"
										tour={tour}
										className="h-full"
										coupons={rootLoaderData.couponsResp.coupons ?? []}
									/>
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

				<CollectionsSection
					collections={loaderData.collectionsResp.collections}
					title={"Best Collections in " + cityData.data.name}
					isCity={true}
				/>

				<section className="space-y-10 mt-16">
					<WhyUsSection />
					<InquiryBanner
						heading={`Ready to experience top attractions in ${cityData.data.name ?? "UAE"}?`}
						details={`Send us a quick inquiry! We’ll help you plan a perfect ${cityData.data.name ?? "UAE"} experience.`}
					/>
				</section>
			</div>
		</>
	);
}
