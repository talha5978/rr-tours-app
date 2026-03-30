import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type {
	AdminCoupon,
	adminCouponsResp,
	CouponDetailsForUpdate,
	FrontPanelCoupon,
	FrontPanelCouponsResp,
} from "@workspace/shared/types/coupons";
import { type AddCouponSchemaType } from "@workspace/shared/schemas/coupon.schema";
import { TablesUpdate } from "@workspace/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class CouponsService extends Service {
	/** Function to be used in the confirm checkout action function */
	async fetchAdminCouponsList(code?: string): Promise<adminCouponsResp> {
		// Main query: fetch all coupons
		let query = this.supabase
			.from(this.COUPONS_TABLE)
			.select("*")
			.order("created_at", { ascending: false });

		if (code) {
			query = query.ilike("code", `%${code}%`);
		}

		const { data: coupons, error } = await query;

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

	/**
	 * Fetches all active AUTOMATIC coupons that still have remaining uses,
	 * including full coupon details + which tours/tour_options they apply to.
	 * Respects total_usage_limit and per_user_limit.
	 */
	async getCouponsForFrontPanel(userId?: string | null): Promise<FrontPanelCouponsResp> {
		const { data: coupons, error: couponError } = await this.supabase
			.from(this.COUPONS_TABLE)
			.select(
				`
				*,
				${this.COUPON_TOURS_TABLE}(
					tour_option_id,
					${this.TOUR_OPTIONS_TABLE}!inner(tour_id)
				)
			`,
			)
			.eq("is_active", true)
			.eq("coupon_type", "AUTOMATIC")
			.order("created_at", { ascending: false })
			.limit(100);

		if (couponError) {
			console.error("Error fetching automatic coupons:", couponError);
			return { coupons: [] };
		}

		if (!coupons || coupons.length === 0) {
			return { coupons: [] };
		}

		const couponIds = coupons.map((c) => c.id);

		// Get usage counts for total_usage_limit check
		const { data: usageData } = await this.supabase
			.from(this.COUPON_USAGES_TABLE)
			.select("coupon_id, count()")
			.in("coupon_id", couponIds)
			.limit(1000);

		const totalUsageMap = new Map<number, number>();
		usageData?.forEach((row) => {
			totalUsageMap.set(row.coupon_id, Number(row.count) || 0);
		});

		//  If user is logged in, get per-user usage
		const perUserUsageMap = new Map<number, number>();
		if (userId) {
			const { data: userUsageData } = await this.supabase
				.from(this.COUPON_USAGES_TABLE)
				.select("coupon_id, count()")
				.eq("user_id", userId)
				.in("coupon_id", couponIds)
				.limit(500);

			userUsageData?.forEach((row) => {
				perUserUsageMap.set(row.coupon_id, Number(row.count) || 0);
			});
		}

		// Filter coupons that still have remaining uses
		const validCoupons = coupons.filter((coupon) => {
			const usedTotal = totalUsageMap.get(coupon.id) || 0;
			const usedByUser = perUserUsageMap.get(coupon.id) || 0;

			// Check total usage limit
			if (coupon.total_usage_limit !== null && usedTotal >= coupon.total_usage_limit) {
				return false;
			}

			// Check per-user limit
			if (coupon.per_user_limit !== null && usedByUser >= coupon.per_user_limit) {
				return false;
			}

			return true;
		});

		//Build final response with tours mapping
		const result: FrontPanelCoupon[] = validCoupons.map((coupon) => {
			const tourMap = new Map<string, number[]>();

			(coupon.coupon_tours || []).forEach((ct) => {
				const tourId = ct.tour_options?.tour_id;
				if (!tourId) return;

				if (!tourMap.has(tourId)) {
					tourMap.set(tourId, []);
				}
				tourMap.get(tourId)!.push(ct.tour_option_id);
			});

			const tours = Array.from(tourMap.entries()).map(([id, tour_options]) => ({
				id,
				tour_options: tour_options.map((optionId) => ({ id: optionId })),
			}));

			const { coupon_tours, ...cleanCoupon } = coupon;

			return {
				...cleanCoupon,
				tours,
			} as FrontPanelCoupon;
		});

		return {
			coupons: result,
		};
	}

	async getCouponById(couponId: number): Promise<CouponDetailsForUpdate> {
		const { data: coupon, error: couponError } = await this.supabase
			.from(this.COUPONS_TABLE)
			.select(
				`
				*,
				${this.COUPON_TOURS_TABLE}(
					tour_option_id,
					${this.TOUR_OPTIONS_TABLE}(name, tour_id, ${this.TOURS_TABLE}(name))
				)
			`,
			)
			.eq("id", couponId)
			.limit(1)
			.single();

		if (couponError || !coupon) {
			console.error("Error fetching automatic coupon:", couponError);
			return { data: null };
		}

		return {
			data: {
				...coupon,
				tours: (coupon.coupon_tours || []).map((ct) => ({
					id: ct.tour_options?.tour_id || "",
					name: ct.tour_options?.name || "",
					tour_options: [{ id: ct.tour_option_id, name: ct.tour_options?.name || "" }],
				})),
			},
		};
	}

	/** Update coupon basic details and tour restrictions */
	async updateCoupon(couponId: number, payload: FormData) {
		const updateData: TablesUpdate<"coupons"> = {};

		if (payload.has("code")) updateData.code = payload.get("code") as string;
		if (payload.has("valid_from")) updateData.valid_from = payload.get("valid_from") as string;
		if (payload.has("valid_until")) updateData.valid_until = payload.get("valid_until") as string;
		if (payload.has("is_active")) updateData.is_active = payload.get("is_active") === "Y";
		console.log(updateData);

		// Update main coupon record if anything changed
		if (Object.keys(updateData).length > 0) {
			const { error } = await this.supabase
				.from(this.COUPONS_TABLE)
				.update(updateData)
				.eq("id", couponId);

			if (error) throw new ApiError(error.message, 500);
		}

		// Handle tour option restrictions (add + remove)
		const added = payload.getAll("added_tour_option_ids[]").map(Number);
		const removed = payload.getAll("removed_tour_option_ids[]").map(Number);

		// Remove old restrictions
		if (removed.length > 0) {
			const { error } = await this.supabase
				.from(this.COUPON_TOURS_TABLE)
				.delete()
				.eq("coupon_id", couponId)
				.in("tour_option_id", removed);

			if (error) throw new ApiError(error.message, 500);
		}

		// Add new restrictions
		if (added.length > 0) {
			const inserts = added.map((tourOptionId) => ({
				coupon_id: Number(couponId),
				tour_option_id: tourOptionId,
			}));

			const { error } = await this.supabase.from(this.COUPON_TOURS_TABLE).insert(inserts);

			if (error) throw new ApiError(error.message, 500);
		}

		return { success: true };
	}
}
