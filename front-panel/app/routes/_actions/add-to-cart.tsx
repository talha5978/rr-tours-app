import { CartService } from "@workspace/shared/services/cart.service";
import { queryClient } from "@workspace/shared/utils/query-client";
import { type ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
	const body = await request.json();

	try {
		const cartSvc = new CartService(request);
		const data = await cartSvc.addToCart(body);

		await queryClient.invalidateQueries({ queryKey: ["my_cart", body.user_id] });

		return data;
	} catch (err: any) {
		return { success: false, error: err.message ?? "Failed to add to cart" };
	}
};
