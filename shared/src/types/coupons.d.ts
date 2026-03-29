import { type Database } from "@workspace/shared/types/supabase";

type AdminCoupon = Database["public"]["Tables"]["coupons"]["Row"] & {
	usage_count: number;
	restricted_tour_options_count: number;
};

export type adminCouponsResp = {
	coupons: AdminCoupon[];
};
