import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import type { DashboardMainStats } from "@workspace/shared/types/stats";

@UseClassMiddleware(loggerMiddleware)
export class StatsService extends Service {
	/** Get stats for admin panel home */
	async getDashboardMainStats(): Promise<DashboardMainStats> {
		let payload: DashboardMainStats = {
			total_tours: 0,
			total_bookings: 0,
			total_categories: 0,
			total_revenue: 0,
		};

		// Total tours
		const { count: total_tours, error: toursError } = await this.supabase
			.from(this.TOURS_TABLE)
			.select("*", { count: "exact", head: true });

		if (toursError) {
			payload.total_tours = 0;
		} else {
			payload.total_tours = total_tours ?? 0;
		}

		// Total bookings
		const { count: total_bookings, error: bookingsError } = await this.supabase
			.from("bookings_new")
			.select("*", { count: "exact", head: true })
			.in("booking_status", ["CONFIRMED"]);

		if (bookingsError) {
			payload.total_bookings = 0;
		} else {
			payload.total_bookings = total_bookings ?? 0;
		}

		// Total categories
		const { count: total_categories, error: categoriesError } = await this.supabase
			.from(this.CATEGORIES_TABLE)
			.select("*", { count: "exact", head: true });

		if (categoriesError) {
			payload.total_categories = 0;
		} else {
			payload.total_categories = total_categories ?? 0;
		}

		// Correct dot-notation syntax
		const { data: revenueAgg, error: revenueAggError } = await this.supabase
			.from("bookings_new")
			.select("total_revenue:total.sum()")
			.in("booking_status", ["CONFIRMED"])
			.single();

		console.log(revenueAgg, revenueAggError);

		if (revenueAggError) {
			payload.total_revenue = 0;
		} else {
			payload.total_revenue = revenueAgg?.total_revenue ?? 0;
		}

		return payload;
	}
}
