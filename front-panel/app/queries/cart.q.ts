import { queryOptions } from "@tanstack/react-query";
import { CartService } from "@workspace/shared/services/cart.service";

export const myCartQuery = ({
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
	return queryOptions({
		queryKey: ["my_cart", user_id, page, limit],
		queryFn: async () => {
			if (user_id == null) return null;
			const svc = new CartService(request);
			const result = await svc.getCart(user_id, page, limit);
			return result;
		},
		enabled: !!user_id,
		staleTime: 10 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};
