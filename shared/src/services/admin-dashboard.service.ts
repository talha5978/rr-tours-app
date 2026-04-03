import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { BookingForExport, MainBarChartData } from "@workspace/shared/types/admin-dashboard";
import { format, startOfDay, subDays } from "date-fns";
import type { DashboardMainStats } from "@workspace/shared/types/stats";

@UseClassMiddleware(loggerMiddleware)
export class AdminDashboardService extends Service {
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
			.from(this.BOOKINGS_TABLE)
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
			.from(this.BOOKINGS_TABLE)
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

	/** Get bookings data for main dashboard chart */
	async getBookingsDataForChart(): Promise<MainBarChartData> {
		try {
			const now = new Date();
			const threeMonthsAgo = subDays(startOfDay(now), 90);

			const { data, error } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.select("created_at")
				.eq("booking_status", "CONFIRMED")
				.gte("created_at", threeMonthsAgo.toISOString())
				.lte("created_at", now.toISOString());

			if (error || !data || data.length === 0) {
				console.error("Error fetching bookings data:", error);
				return {
					data: [],
					error: new ApiError("Failed to fetch bookings data", Number(error?.code) ?? 500, [error]),
				};
			}

			// Group by date (truncate to day)
			const grouped = new Map<string, { bookings: number }>();

			data.forEach((order) => {
				const dateKey = format(new Date(order.created_at), "yyyy-MM-dd");
				const existing = grouped.get(dateKey) || { bookings: 0 };
				existing.bookings += 1;
				grouped.set(dateKey, existing);
			});

			// Generate full date range and fill missing days with 0
			const result: { date: string; bookings: number }[] = [];
			let currentDate = threeMonthsAgo;

			while (currentDate <= now) {
				const dateStr = format(currentDate, "yyyy-MM-dd");
				const dayData = grouped.get(dateStr) || { bookings: 0 };

				result.push({
					date: dateStr,
					bookings: dayData.bookings,
				});

				currentDate = new Date(currentDate);
				currentDate.setDate(currentDate.getDate() + 1);
			}

			return {
				data: result,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { data: [], error: err };
			}

			return {
				data: [],
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch bookings for exports */
	async fetchBookingsForExport(startDate: string, endDate: string): Promise<BookingForExport[]> {
		const { data, error } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select(
				`*, ${this.BOOKING_ITEMS_TABLE} (*, ${this.TOUR_OPTIONS_TABLE} (name)), payment:${this.PAYMENTS_TABLE}!inner (payment_status, paid_at, paid_amount)`,
			)
			.gte("created_at", `${startDate}T00:00:00`)
			.lte("created_at", `${endDate}T23:59:59`)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Export fetch error:", error);
			throw new Error(error.message);
		}

		return (data as any) || [];
	}
}
