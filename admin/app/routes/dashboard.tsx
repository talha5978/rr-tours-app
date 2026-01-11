import { queryClient } from "@workspace/shared/utils/query-client";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { TopAnalyticsBar } from "~/components/Dashboard/AnalyticsBar";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { dashboardMainstatsQuery } from "~/queries/stats.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const dashboardMainStats = await queryClient.fetchQuery(dashboardMainstatsQuery({ request }));

	return { dashboardMainStats };
};

export default function Home() {
	const { dashboardMainStats } = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Dashboard | Top Attractions Dubai"
				metaDescription="See stats and overview of the system in dashboard"
			/>
			<section>
				<TopAnalyticsBar
					total_bookings={dashboardMainStats.total_bookings.toString()}
					total_revenue={dashboardMainStats.total_revenue.toString()}
					total_tours={dashboardMainStats.total_tours.toString()}
					total_categories={dashboardMainStats.total_categories.toString()}
				/>
			</section>
		</>
	);
}
