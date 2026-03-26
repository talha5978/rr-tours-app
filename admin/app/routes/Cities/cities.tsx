import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { HighLevelCity } from "@workspace/shared/types/cities";
import { formatDistanceToNow } from "date-fns";
import { PenBox, PlusCircle } from "lucide-react";
import { memo, useEffect } from "react";
import { Link, type LoaderFunctionArgs, useLoaderData, useLocation, useNavigation } from "react-router";
import { toast } from "sonner";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { highLevelCitiesQuery } from "~/queries/cities.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await highLevelCitiesQuery({ request });
	return data;
};

export default function CitiesPage() {
	const loaderData = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	useEffect(() => {
		if (loaderData.error != null && loaderData.error.message) {
			toast.error(`${loaderData.error.statusCode} - ${loaderData.error.message}`);
		}
	}, [loaderData.error]);

	return (
		<>
			<MetaDetails
				metaTitle="Cities | Admin Panel"
				metaDescription="Manage the cities where you offer tours."
				metaKeywords="Cities"
			/>
			<section className="flex flex-1 flex-col gap-8">
				<div className="flex justify-between gap-3 flex-wrap">
					<h1 className="text-2xl font-semibold">Cities</h1>
					<Link to="/cities/add" viewTransition className="ml-auto" prefetch="intent">
						<Button size="sm" className="ml-auto">
							<PlusCircle width={18} />
							<span>Add City</span>
						</Button>
					</Link>
				</div>

				<div className="flex gap-4 flex-wrap">
					{isFetchingThisRoute ? (
						<CityCardSkeleton />
					) : loaderData.data.length > 0 ? (
						loaderData.data.map((c) => <CityCard city={c} />)
					) : (
						<div className="flex items-center justify-center w-full h-[50vh]">
							<p className="text-muted-foreground">No cities found.</p>
						</div>
					)}
				</div>
			</section>
		</>
	);
}

const createdAtLabel = (date: string | null) => {
	return date ? `${formatDistanceToNow(new Date(date), { addSuffix: true })}` : "-";
};

const CityCard = memo(({ city }: { city: HighLevelCity }) => {
	return (
		<Link to={`/tours?cities=${city.id}`} prefetch="intent" key={city.id} viewTransition>
			<div className="h-88 flex flex-col max-w-60 rounded-xl shadow-lg overflow-hidden relative group">
				<div className="flex-1 w-full relative overflow-hidden">
					<img
						src={SUPABASE_IMAGE_BUCKET_PATH + "/" + city.card_image}
						alt={city.name}
						className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
					/>

					<div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
						{city.tours} Tours
					</div>
				</div>

				<div className="p-4 bg-secondary relative group">
					<div>
						<h2 className="font-semibold line-clamp-2">{city.name}</h2>
						<p className="text-secondary-foreground text-xs mt-1">
							Added {createdAtLabel(city.created_at)}
						</p>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to={`/cities/${city.id}/update`}
								className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-accent"
							>
								<PenBox className="w-4 h-4 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
							</Link>
						</TooltipTrigger>
						<TooltipContent side="top" align="center">
							Update
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</Link>
	);
});

const CityCardSkeleton = () => {
	return (
		<div className="h-88 flex flex-col w-60 rounded-xl shadow-lg overflow-hidden relative">
			{/* Image skeleton */}
			<div className="flex-1 w-full relative overflow-hidden">
				<Skeleton className="bg-muted-foreground w-full h-full" />
				<Skeleton className="bg-muted-foreground absolute top-3 right-3 h-6 w-16 rounded-full" />
			</div>

			{/* Content skeleton */}
			<div className="p-4 bg-secondary space-y-2">
				<Skeleton className="bg-muted-foreground h-4 w-3/4" />
				<Skeleton className="bg-muted-foreground h-3 w-24" />
			</div>
		</div>
	);
};
