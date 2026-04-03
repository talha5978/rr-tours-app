import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { TopAnalyticsBar } from "~/components/Dashboard/AnalyticsBar";
import { DashboardMainChart } from "~/components/Dashboard/Charts";
import { RecentBookingsCard } from "~/components/Dashboard/RecentBookings";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { highLevelBookingsQuery } from "~/queries/bookings.q";
import { bookingsChartDataQuery, dashboardMainstatsQuery } from "~/queries/stats.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const dashboardMainStats = await dashboardMainstatsQuery({ request });
	const recentBookings = await highLevelBookingsQuery({ request, pageSize: 5 });
	const chartData = await bookingsChartDataQuery({ request });

	return { dashboardMainStats, recentBookings, chartData };
};

export default function Home() {
	const { dashboardMainStats, recentBookings, chartData } = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Dashboard | WanderNest"
				metaDescription="See stats and overview of the system in dashboard"
			/>
			<section className="space-y-4">
				<TopAnalyticsBar
					total_bookings={dashboardMainStats.total_bookings.toString()}
					total_revenue={dashboardMainStats.total_revenue.toString()}
					total_tours={dashboardMainStats.total_tours.toString()}
					total_categories={dashboardMainStats.total_categories.toString()}
				/>
				<DashboardMainChart chartData={chartData.data} />
				<RecentBookingsCard recentBookings={recentBookings.bookings ?? []} />
			</section>
		</>
	);
}
