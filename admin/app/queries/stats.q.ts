import { cacheService } from "@workspace/shared/services/cache.service";
import { StatsService } from "@workspace/shared/services/stats.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const dashboardMainstatsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new StatsService(request);
		const resp = await svc.getDashboardMainStats();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.stats.dashboardMainStats(), queryFn);
	return result;
};
