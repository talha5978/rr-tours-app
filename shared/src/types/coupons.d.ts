import { type Database } from "@workspace/shared/types/supabase";

type AdminCoupon = Database["public"]["Tables"]["coupons"]["Row"] & {
	usage_count: number;
	restricted_tour_options_count: number;
};

export type adminCouponsResp = {
	coupons: AdminCoupon[];
};

export type FrontPanelCoupon = Database["public"]["Tables"]["coupons"]["Row"] & {
	tours: {
		id: string;
		tour_options: { id: number }[];
	}[];
};

export type FrontPanelCouponsResp = {
	coupons: FrontPanelCoupon[];
};

export type CouponDetailsForUpdate = {
	data:
		| (Database["public"]["Tables"]["coupons"]["Row"] & {
				tours: {
					id: string;
					name: string;
					tour_options: { id: number; name: string }[];
				}[];
		  })
		| null;
};
