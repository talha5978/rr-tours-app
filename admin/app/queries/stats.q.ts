import { AdminDashboardService } from "@workspace/shared/services/admin-dashboard.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const dashboardMainstatsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new AdminDashboardService(request);
		const resp = await svc.getDashboardMainStats();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.dashboard.mainStats(), queryFn);
	return result;
};

export const bookingsChartDataQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new AdminDashboardService(request);
		const resp = await svc.getBookingsDataForChart();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.dashboard.mainChartData(), queryFn);
	return result;
};
