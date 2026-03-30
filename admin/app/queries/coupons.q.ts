import { cacheService } from "@workspace/shared/services/cache.service";
import { CouponsService } from "@workspace/shared/services/coupons.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const highLevelCouponsQuery = async ({ request, q }: { request: Request; q: string }) => {
	const queryFn = async () => {
		const svc = new CouponsService(request);
		const resp = await svc.fetchAdminCouponsList(q);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.coupons.highLevelAD(q), queryFn, 900);
	return result;
};

export const getCouponById = async ({ request, couponId }: { request: Request; couponId: number }) => {
	const queryFn = async () => {
		const svc = new CouponsService(request);
		const resp = await svc.getCouponById(couponId);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.coupons.details("AD", couponId), queryFn, 900);
	return result;
};
