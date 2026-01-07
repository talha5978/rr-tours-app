import { queryOptions } from "@tanstack/react-query";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import type { CacheEvent } from "@workspace/shared/types/cache-events";

export const getCacheInvalidationEvents = ({
	request,
	target,
}: {
	request: Request;
	target: CacheEvent["target"];
}) => {
	return queryOptions<CacheEvent[]>({
		queryKey: ["cache_events", target],
		queryFn: async () => {
			const svc = new CacheInvalidationService(request);
			const result = await svc.getCacheInvalidationEvents(target);
			return result;
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});
};
