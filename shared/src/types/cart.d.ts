import type { TablesInsert } from "@workspace/shared/types/supabase";

export type AddToCartPayload = {
	user_id: string;
	cart_items: {
		preferred_date: string;
		preferred_timeslot: string;
		tour_option_id: number;
		quantities: {
			participant_type_id: number;
			quantity: number;
		}[];
	}[];
};

export type CartItemDetail = {
	cart_item_id: number;
	tour_option_id: number;
	preferred_date: string | null;
	preferred_timeslot: string | null;
	created_at: string | null;
	tour_option_name: string | null;
	tour_id: string | null;
	tour_name: string | null;
	quantities: Array<{
		participant_type_id: number;
		quantity: number;
		participant_type_name: string | null;
		participant_age_group: string | null;
		price: number;
	}>;
};

export type GetCartResponse = {
	success: boolean;
	cart_id: number | null;
	total_items: number;
	items: CartItemDetail[];
	pagination: {
		page: number;
		pageSize: number;
		totalPages: number;
		hasMore: boolean;
	};
	error?: string;
};
