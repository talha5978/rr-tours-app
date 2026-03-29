import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { AdminCoupon, adminCouponsResp } from "@workspace/shared/types/coupons";
import { AddCouponSchemaType } from "@workspace/shared/schemas/coupon.schema";

@UseClassMiddleware(loggerMiddleware)
export class CouponsService extends Service {
	/** Function to be used in the confirm checkout action function */
	async fetchAdminCouponsList(): Promise<adminCouponsResp> {
		// Main query: fetch all coupons
		const { data: coupons, error } = await this.supabase
			.from(this.COUPONS_TABLE)
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw new ApiError(error.message, 500);
		if (!coupons || coupons.length === 0) return { coupons: [] };

		const couponIds = coupons.map((c) => c.id);

		const { data: usageAgg } = await this.supabase
			.from(this.COUPON_USAGES_TABLE)
			.select("coupon_id, count")
			.in("coupon_id", couponIds);

		const usageMap = new Map<number, number>();
		usageAgg?.forEach((row) => {
			usageMap.set(row.coupon_id, Number(row.count) || 0);
		});

		const { data: tourAgg } = await this.supabase
			.from(this.COUPON_TOURS_TABLE)
			.select("coupon_id, count()")
			.in("coupon_id", couponIds);

		const tourMap = new Map<number, number>();
		tourAgg?.forEach((row) => {
			tourMap.set(row.coupon_id, Number(row.count) || 0);
		});

		return {
			coupons: coupons.map((coupon) => ({
				...coupon,
				usage_count: usageMap.get(coupon.id) || 0,
				restricted_tour_options_count: tourMap.get(coupon.id) || 0,
			})) as AdminCoupon[],
		};
	}

	/** Add coupon */
	async addCoupon(input: AddCouponSchemaType) {
		const { data: coupon, error: couponError } = await this.supabase
			.from(this.COUPONS_TABLE)
			.insert({
				code: input.code,
				coupon_type: input.coupon_type,
				discount_type: input.discount_type,
				discount_value: input.discount_value,
				valid_from: input.valid_from,
				valid_until: input.valid_until,
				min_subtotal: input.min_subtotal,
				total_usage_limit: input.total_usage_limit,
				per_user_limit: input.per_user_limit,
				is_active: input.is_active,
			})
			.select("id")
			.single();

		if (couponError) {
			throw new ApiError(couponError.message, Number(couponError.code) ?? 500, [couponError.details]);
		}

		// Insert tour options if any specific tour_options selected
		if (input.tour_option_ids && input.tour_option_ids.length > 0) {
			const couponTourInserts = input.tour_option_ids.map((tourOptionId) => ({
				coupon_id: coupon.id,
				tour_option_id: tourOptionId,
			}));

			const { error: relationError } = await this.supabase
				.from(this.COUPON_TOURS_TABLE)
				.insert(couponTourInserts);

			if (relationError) {
				await this.supabase.from(this.COUPONS_TABLE).delete().eq("id", coupon.id);
				throw new ApiError(relationError.message, Number(relationError.code) ?? 500, [
					relationError.details,
				]);
			}
		}

		return { success: true };
	}
}
