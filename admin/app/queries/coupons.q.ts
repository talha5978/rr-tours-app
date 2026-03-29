import { cacheService } from "@workspace/shared/services/cache.service";
import { CouponsService } from "@workspace/shared/services/coupons.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const highLevelCouponsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CouponsService(request);
		const resp = await svc.fetchAdminCouponsList();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.coupons.highLevelAD(), queryFn, 900);
	return result;
};
