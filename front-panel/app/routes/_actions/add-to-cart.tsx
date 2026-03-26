import { cacheService } from "@workspace/shared/services/cache.service";
import { CartService } from "@workspace/shared/services/cart.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { type ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
	const body = await request.json();

	try {
		const cartSvc = new CartService(request);
		const data = await cartSvc.addToCart(body);

		await cacheService.invalidatePattern(CACHE_KEYS.cart.user_cart(body.user_id) + ":*");

		return data;
	} catch (err: any) {
		return { success: false, error: err.message ?? "Failed to add to cart" };
	}
};
