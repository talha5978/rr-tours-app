import { queryOptions } from "@tanstack/react-query";
import { StatsService } from "@workspace/shared/services/stats.service";
import type { DashboardMainStats } from "@workspace/shared/types/stats";

export const dashboardMainstatsQuery = ({ request }: { request: Request }) => {
	return queryOptions<DashboardMainStats>({
		queryKey: ["dashboard_main_stats"],
		queryFn: async () => {
			const svc = new StatsService(request);
			const result = await svc.getDashboardMainStats();
			return result;
		},
	});
};
