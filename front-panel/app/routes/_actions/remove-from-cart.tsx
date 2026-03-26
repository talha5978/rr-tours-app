import { cacheService } from "@workspace/shared/services/cache.service";
import { CartService } from "@workspace/shared/services/cart.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { type ActionFunctionArgs } from "react-router";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const cart_item_id = params.cart_item_id as string;
	const user_id = params.user_id as string;

	if (!cart_item_id || !user_id) {
		return { success: false, error: "Invalid request" };
	}

	try {
		const cartSvc = new CartService(request);
		const data = await cartSvc.removeFromCart(Number(cart_item_id));

		await cacheService.invalidatePattern(CACHE_KEYS.cart.user_cart(user_id) + ":*");

		return data;
	} catch (err: any) {
		return { success: false, error: err.message ?? "Failed to remove from cart" };
	}
};
