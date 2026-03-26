import { cacheService } from "@workspace/shared/services/cache.service";
import { CartService } from "@workspace/shared/services/cart.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const myCartQuery = async ({
	request,
	user_id,
	page = 1,
	limit = 15,
}: {
	request: Request;
	user_id: string;
	page?: number;
	limit?: number;
}) => {
	if (user_id == null) return null;

	const queryFn = async () => {
		const svc = new CartService(request);
		const result = await svc.getCart(user_id, page, limit);
		return result;
	};

	const result = await cacheService.get(CACHE_KEYS.cart.user_cart(user_id, page, limit), queryFn);
	return result;
};
