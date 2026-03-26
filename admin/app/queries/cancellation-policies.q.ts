import { cacheService } from "@workspace/shared/services/cache.service";
import { CancellationPoliciesService } from "@workspace/shared/services/cancellation-policies.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const cancellationPoliciesQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CancellationPoliciesService(request);
		const result = await svc.getCancellationPolicies();
		return result;
	};

	const result = await cacheService.get(CACHE_KEYS.cancellationPolicies.list(), queryFn, 86400);
	return result;
};
