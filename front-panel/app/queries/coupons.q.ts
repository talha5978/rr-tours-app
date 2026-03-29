import { cacheService } from "@workspace/shared/services/cache.service";
import { CouponsService } from "@workspace/shared/services/coupons.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const allCouponsQuery = async ({ request, user_id }: { request: Request; user_id?: string }) => {
	const queryFn = async () => {
		const svc = new CouponsService(request);
		const resp = await svc.getCouponsForFrontPanel(user_id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.coupons.allFP(user_id), queryFn, 900);
	return result;
};
