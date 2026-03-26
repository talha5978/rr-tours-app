import { cacheService } from "@workspace/shared/services/cache.service";
import { CartService } from "@workspace/shared/services/cart.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { type ActionFunctionArgs } from "react-router";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const user_id = params.user_id as string;

	try {
		if (user_id == null) {
			return { success: false, error: "Invalid request" };
		}

		const cartSvc = new CartService(request);
		const data = await cartSvc.clearCart(user_id);

		await cacheService.invalidatePattern(CACHE_KEYS.cart.user_cart(user_id) + ":*");

		return data;
	} catch (err: any) {
		return { success: false, error: err.message ?? "Failed to clear cart" };
	}
};
