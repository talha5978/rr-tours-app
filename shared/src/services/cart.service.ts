import { Service } from "@workspace/shared/services/service.base";
import type { AddToCartPayload, CartItemDetail, GetCartResponse } from "@workspace/shared/types/cart";
import { ApiError } from "@workspace/shared/utils/ApiError";

export class CartService extends Service {
	/** Add one or more items to cart using atomic Postgres function */
	async addToCart(data: AddToCartPayload) {
		const { data: result, error } = await this.supabase.rpc("add_to_cart", {
			p_user_id: data.user_id,
			p_cart_items: data.cart_items,
		});

		if (error) {
			return {
				error: new ApiError(error.message, 500, [error]),
			};
		}

		if (!(result as any)?.success) {
			return {
				error: new ApiError((result as any)?.error || "Unknown error", 400),
			};
		}

		return { success: true };
	}

	/** Get user cart */
	async getCart(user_id: string, page: number = 1, pageSize: number = 15): Promise<GetCartResponse> {
		try {
			// 1. Get user's cart
			const { data: cart, error: cartError } = await this.supabase
				.from(this.CARTS_TABLE)
				.select("id")
				.eq("user_id", user_id)
				.single();

			if (cartError || !cart) {
				return {
					success: false,
					cart_id: null,
					total_items: 0,
					items: [],
					pagination: { page, pageSize, totalPages: 0, hasMore: false },
					error: cartError?.message || "Cart not found",
				};
			}

			const cartId = cart.id;

			// 2. Get total count for pagination
			const { count: totalCount, error: countError } = await this.supabase
				.from(this.CART_ITEMS_TABLE)
				.select("*", { count: "exact", head: true })
				.eq("cart_id", cartId);

			if (countError) {
				return {
					success: false,
					cart_id: cartId,
					total_items: 0,
					items: [],
					pagination: { page, pageSize, totalPages: 0, hasMore: false },
					error: countError.message || "Failed to count items",
				};
			}

			const totalItems = totalCount ?? 0;
			const totalPages = Math.ceil(totalItems / pageSize);
			const hasMore = page < totalPages;

			// 3. Fetch paginated cart items with joins
			const { data: cartItems, error: itemsError } = await this.supabase
				.from(this.CART_ITEMS_TABLE)
				.select(
					`
						id,
						tour_option_id,
						preferred_date,
						preferred_timeslot,
						created_at,
						${this.TOUR_OPTIONS_TABLE}!inner (
							name,
							tour_id,
							${this.TOURS_TABLE}!inner (
								name
							)
						)
					`,
				)
				.eq("cart_id", cartId)
				.range((page - 1) * pageSize, page * pageSize - 1)
				.order("created_at", { ascending: false });

			if (itemsError || !cartItems) {
				return {
					success: false,
					cart_id: cartId,
					total_items: totalItems,
					items: [],
					pagination: { page, pageSize, totalPages, hasMore },
					error: itemsError?.message || "Failed to fetch cart items",
				};
			}

			// 4. Fetch all quantities for these items
			const cartItemIds = cartItems.map((item) => item.id);

			const { data: quantities, error: qtyError } = await this.supabase
				.from(this.CART_ITEMS_QUANTITIES_TABLE)
				.select(
					`
					cart_item_id,
					participant_type_id,
					quantity,
					${this.PARTICIPANT_TYPES_TABLE}!inner (
						name,
						age_min,
						age_max
					)
				`,
				)
				.in("cart_item_id", cartItemIds);

			if (qtyError) {
				return {
					success: false,
					cart_id: cartId,
					total_items: totalItems,
					items: [],
					pagination: { page, pageSize, totalPages, hasMore },
					error: qtyError.message || "Failed to fetch quantities",
				};
			}

			// 5. Batch fetch ALL relevant prices for these tour options
			const tourOptionIds = [...new Set(cartItems.map((item) => item.tour_option_id))];

			const { data: allPrices, error: priceError } = await this.supabase
				.from(this.TOUR_OPTION_PRICES_TABLE)
				.select("tour_option_id, participant_type_id, price")
				.in("tour_option_id", tourOptionIds);

			if (priceError) {
				return {
					success: false,
					cart_id: cartId,
					total_items: totalItems,
					items: [],
					pagination: { page, pageSize, totalPages, hasMore },
					error: priceError.message || "Failed to fetch prices",
				};
			}

			// Build price map: tour_option_id → participant_type_id → price
			const priceMap = new Map<number, Map<number, number>>();
			allPrices?.forEach((p) => {
				if (!priceMap.has(p.tour_option_id)) {
					priceMap.set(p.tour_option_id, new Map());
				}
				priceMap.get(p.tour_option_id)!.set(p.participant_type_id, p.price);
			});

			// 6. Group quantities by cart_item_id + attach real price
			const quantitiesByItem = new Map<number, any[]>();
			quantities?.forEach((q: any) => {
				const itemId = q.cart_item_id;
				if (!quantitiesByItem.has(itemId)) {
					quantitiesByItem.set(itemId, []);
				}

				// Find the tour_option_id for this cart item
				const cartItem = cartItems.find((ci) => ci.id === itemId);
				const tourOptionId = cartItem?.tour_option_id;

				const realPrice = tourOptionId
					? (priceMap.get(tourOptionId)?.get(q.participant_type_id) ?? 0)
					: 0;

				quantitiesByItem.get(itemId)!.push({
					participant_type_id: q.participant_type_id,
					quantity: q.quantity,
					participant_type_name: q.participant_types?.name || null,
					participant_age_group:
						q.participant_types?.age_max === 0 && q.participant_types?.age_min === 0
							? "Group"
							: q.participant_types?.age_max === 99
								? `${q.participant_types.age_min}+`
								: `${q.participant_types.age_min}-${q.participant_types.age_max}`,
					price: realPrice,
				});
			});

			// 7. Build final response
			const items: CartItemDetail[] = cartItems.map((ci: any) => ({
				cart_item_id: ci.id,
				tour_option_id: ci.tour_option_id,
				preferred_date: ci.preferred_date,
				preferred_timeslot: ci.preferred_timeslot,
				created_at: ci.created_at,
				tour_option_name: ci.tour_options?.name || null,
				tour_id: ci.tour_options?.tour_id || null,
				tour_name: ci.tour_options?.tours?.name || null,
				quantities: quantitiesByItem.get(ci.id) || [],
			}));

			return {
				success: true,
				cart_id: cartId,
				total_items: totalItems,
				items,
				pagination: {
					page,
					pageSize,
					totalPages,
					hasMore,
				},
			};
		} catch (err: any) {
			return {
				success: false,
				cart_id: null,
				total_items: 0,
				items: [],
				pagination: { page, pageSize, totalPages: 0, hasMore: false },
				error: err.message || "Unexpected error fetching cart",
			};
		}
	}

	/** Remove item from cart */
	async removeFromCart(cart_item_id: number) {
		const p1 = this.supabase.from(this.CART_ITEMS_TABLE).delete().eq("id", cart_item_id);

		const p2 = this.supabase
			.from(this.CART_ITEMS_QUANTITIES_TABLE)
			.delete()
			.eq("cart_item_id", cart_item_id);

		const [res1, res2] = await Promise.allSettled([p1, p2]);

		if (res1.status === "rejected" || res2.status === "rejected") {
			return { success: false, error: "Failed to remove from cart" };
		}

		return { success: true };
	}

	/** Clear a user whole cart */
	async clearCart(user_id: string) {
		try {
			// 1. Find user's cart
			const { data: cart, error: cartError } = await this.supabase
				.from(this.CARTS_TABLE)
				.select("id")
				.eq("user_id", user_id)
				.single();

			if (cartError || !cart) {
				return {
					error: new ApiError(cartError?.message || "Cart not found for this user", 404, [
						cartError,
					]),
				};
			}

			const cartId = cart.id;

			const { data: cartItems } = await this.supabase
				.from(this.CART_ITEMS_TABLE)
				.select("id")
				.eq("cart_id", cartId);

			if (!cartItems) {
				return {
					error: new ApiError("Cart items not found", 404),
				};
			}

			const { error: qtyDeleteError } = await this.supabase
				.from(this.CART_ITEMS_QUANTITIES_TABLE)
				.delete()
				.in(
					"cart_item_id",
					cartItems.map((ci) => ci.id),
				);

			if (qtyDeleteError) {
				return {
					error: new ApiError(qtyDeleteError.message || "Failed to clear item quantities", 500, [
						qtyDeleteError,
					]),
				};
			}

			// 3. Delete all cart_items
			const { error: itemsDeleteError } = await this.supabase
				.from(this.CART_ITEMS_TABLE)
				.delete()
				.eq("cart_id", cartId);

			if (itemsDeleteError) {
				return {
					error: new ApiError(itemsDeleteError.message || "Failed to clear cart items", 500, [
						itemsDeleteError,
					]),
				};
			}

			return { success: true };
		} catch (err: any) {
			return {
				error: new ApiError(err.message || "Unexpected error while clearing cart", 500, [err]),
			};
		}
	}
}
