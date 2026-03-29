import { useLoaderData, useRouteLoaderData, type LoaderFunctionArgs } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { TourCard } from "~/components/Tour/TourCard";
import { Button } from "~/components/ui/button";
import { toursQuery } from "~/queries/tours.q";
import { useFavourites } from "~/utils/favourites.utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const allTours = await toursQuery({ request, pageSize: 150 });
	return allTours.tours ?? [];
};

export default function MyFavourites() {
	const allTours = useLoaderData<typeof loader>();
	const rootLoaderData = useRouteLoaderData("root");
	const { favourites, clear } = useFavourites();
	const favouriteTours = allTours.filter((t) => favourites.includes(t.id));

	return (
		<>
			<MetaDetails metaTitle="My Favourites | WanderNest" metaDescription="My Favourites" />
			<section className="space-y-5 pb-10">
				<div className="flex gap-4 flex-wrap justify-between items-center">
					<h1 className="section-heading">My Favourites</h1>
					<div className="ml-auto w-fit">
						<Button variant="destructive" onClick={clear} className="bg-destructive">
							Clear
						</Button>
					</div>
				</div>
				<div>
					{favouriteTours.length === 0 && (
						<div className="py-10">
							<p className="text-center text-muted-foreground">No tours found</p>
						</div>
					)}

					<ul className="grid gap-4 min-[28rem]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{favouriteTours.length > 0 &&
							favouriteTours.map((tour) => (
								<li key={tour.id}>
									<TourCard
										tour={tour}
										className="h-full"
										coupons={rootLoaderData.couponsResp.coupons ?? []}
									/>
								</li>
							))}
					</ul>
				</div>
			</section>
		</>
	);
}
