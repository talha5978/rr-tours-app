import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import type {
	GetTourReviewsOptions,
	GetTourReviewsResp,
	HomePageReviewsResp,
	HomePageTourReview,
	MyReview,
	MyReviewsBooking,
	MyReviewsBookings,
	MyReviewTour,
	TourReview,
} from "@workspace/shared/types/tour-reviews";
import { AuthService } from "@workspace/shared/services/auth.service";
import { ApiError } from "@workspace/shared/utils/ApiError";

@UseClassMiddleware(loggerMiddleware)
export class ReviewsService extends Service {
	/** Get reviews for a tour */
	async getTourReviews(tour_id: string, options: GetTourReviewsOptions = {}): Promise<GetTourReviewsResp> {
		const { limit = 10, offset = 0, filters = {} } = options;
		const { min_rating, sort_by = "date", sort_order = "desc" } = filters;

		let reviewsQuery = this.supabase
			.from(this.REVIEWS_TABLE)
			.select("*")
			.eq("tour_id", tour_id)
			.range(offset, offset + limit - 1);

		if (min_rating !== undefined) {
			reviewsQuery = reviewsQuery.gte("rating", min_rating);
		}

		const sortField = sort_by === "rating" ? "rating" : "created_at";
		reviewsQuery = reviewsQuery.order(sortField, { ascending: sort_order === "asc" });

		const { data: reviewsResp, error: reviewsError } = await reviewsQuery;

		if (reviewsError) {
			throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
		}

		let reviewsData: TourReview[] = reviewsResp.map((r) => ({
			booking_id: r.booking_id,
			comment: r.comment,
			created_at: r.created_at,
			id: r.id,
			is_verified: r.is_verified,
			rating: r.rating,
			user: null,
		}));

		if (reviewsData != null) {
			for (let i = 0; i < reviewsData.length; i++) {
				const auth_svc = await this.createSubService(AuthService);
				const { data: email_resp } = await auth_svc.getAuthSchemaUser(reviewsResp[i].user_id);

				reviewsData[i].user = {
					id: reviewsResp[i].user_id,
					full_name: email_resp.user?.user_metadata?.full_name ?? "",
					avatar: email_resp.user?.user_metadata?.avatar_url ?? "",
				};
			}
		}

		const reviews = Array.isArray(reviewsData) ? reviewsData : [];

		let countQuery = this.supabase
			.from(this.REVIEWS_TABLE)
			.select("rating, count()")
			.eq("tour_id", tour_id);

		if (min_rating !== undefined) {
			countQuery = countQuery.gte("rating", min_rating);
		}

		const { data: countRows = [], error: countError } = await countQuery;

		if (countError) {
			throw new Error(`Failed to fetch rating distribution: ${countError.message}`);
		}

		let summaryQuery = this.supabase
			.from(this.REVIEWS_TABLE)
			.select("avg:rating.avg(), count()")
			.eq("tour_id", tour_id);

		if (min_rating !== undefined) {
			summaryQuery = summaryQuery.gte("rating", min_rating);
		}

		const { data: summaryRow, error: summaryError } = await summaryQuery.single();

		if (summaryError) {
			throw new Error(`Failed to fetch summary stats: ${summaryError.message}`);
		}

		const rating_counts: Record<1 | 2 | 3 | 4 | 5, number> = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		};

		let total_reviews = 0;
		let sum_weighted = 0;

		(countRows ?? []).forEach((row: any) => {
			if (!row || typeof row !== "object") return;

			const r = Number(row.rating);
			const cnt = Number(row.count) || 0;

			if (Number.isInteger(r) && r >= 1 && r <= 5) {
				rating_counts[r as 1 | 2 | 3 | 4 | 5] = cnt;
				total_reviews += cnt;
				sum_weighted += r * cnt;
			}
		});

		let average_rating = 0;

		if (summaryRow?.avg != null) {
			const dbAvg = Number(summaryRow.avg);
			average_rating = Number.isFinite(dbAvg) ? Number(dbAvg.toFixed(2)) : 0;
		} else if (total_reviews > 0) {
			average_rating = Number((sum_weighted / total_reviews).toFixed(2));
		}

		total_reviews = Number(summaryRow?.count) || total_reviews;

		return {
			reviews,
			stats: {
				average_rating,
				rating_counts,
				total_reviews,
			},
		};
	}

	/** Get reviews for home page */
	async getHomeTourReviews(): Promise<HomePageReviewsResp> {
		const limit = 12;

		let reviewsQuery = this.supabase
			.from(this.REVIEWS_TABLE)
			.select(
				`
				id,
				comment,
				rating,
				created_at,
				user_id,
				tour:${this.TOURS_TABLE}(
					id, name,
					${this.META_DETAILS_TABLE}(url_key)
				),
				user:${this.USERS_TABLE}(
					first_name, last_name
				)
			`,
			)
			.eq("is_verified", true)
			.order("rating", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(limit);

		const { data: reviewsResp, error: reviewsError } = await reviewsQuery;

		if (reviewsError) {
			return {
				reviews: [],
				error: new ApiError(reviewsError?.message, 500, [reviewsError?.details]) ?? null,
			};
		}

		let reviewsData: HomePageTourReview[] = reviewsResp.map((r) => ({
			comment: r.comment,
			created_at: r.created_at,
			id: r.id,
			rating: r.rating,
			user: null,
			tour: {
				id: r.tour.id,
				name: r.tour.name,
				url_key: r.tour.meta_details.url_key,
			},
		}));

		if (reviewsData != null) {
			for (let i = 0; i < reviewsData.length; i++) {
				const auth_svc = await this.createSubService(AuthService);
				const { data: email_resp } = await auth_svc.getAuthSchemaUser(reviewsResp[i].user_id);

				reviewsData[i].user = {
					id: reviewsResp[i].user_id,
					full_name:
						(reviewsResp[i].user?.first_name || "") +
						" " +
						(reviewsResp[i].user?.last_name || ""),
					avatar: email_resp.user?.user_metadata?.avatar_url ?? "",
				};
			}
		}

		return {
			reviews: reviewsData ?? [],
			error: null,
		};
	}

	/** Get user's bookings with their associated reviews for the My Reviews page. */
	async getMyReviewBookings(
		userId: string,
		pageIndex = 0,
		pageSize = 10,
		searchQuery = "",
	): Promise<MyReviewsBookings> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.BOOKINGS_TABLE)
				.select(
					`
					id,
					booking_ref,
					booking_status,
					payment:${this.PAYMENTS_TABLE}(payment_status),
					created_at,
					customer_name,
					${this.BOOKING_ITEMS_TABLE} (
						id,
						preffered_date,
						preffered_timeslot,
						confirmed_date,
						confirmed_timeslot,
						${this.TOUR_OPTIONS_TABLE} (
							name,
							${this.TOURS_TABLE} (id, name)
						)
					),
					${this.REVIEWS_TABLE} (
						id,
						rating,
						comment,
						created_at,
						tour_id
					)
				`,
					{ count: "exact" },
				)
				.eq("booking_status", "CONFIRMED")
				.eq("added_by", userId)
				.order("created_at", { ascending: false })
				.range(from, to);

			if (searchQuery.trim().length > 0) {
				query = query.or(
					`booking_ref.ilike.%${searchQuery}%,tour_reviews.comment.ilike.%${searchQuery}%`,
				);
			}

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError("Failed to fetch your bookings and reviews", 500, [error.message]);
			}

			const bookings: MyReviewsBooking[] = (data ?? []).map((b) => {
				// Group reviews by tour_id
				const reviewsByTour = new Map<string, MyReview[]>();
				(b.tour_reviews || []).forEach((r) => {
					if (!reviewsByTour.has(r.tour_id)) reviewsByTour.set(r.tour_id, []);
					reviewsByTour.get(r.tour_id)!.push({
						id: r.id,
						rating: r.rating,
						comment: r.comment,
						created_at: r.created_at,
					});
				});

				// Build tours array
				const tours: MyReviewTour[] = (b.booking_items || []).map((item) => {
					const tourId = item.tour_options?.tours?.id ?? "";
					return {
						tour_id: tourId,
						tour_name: item.tour_options?.tours?.name ?? "Unknown Tour",
						tour_option_name: item.tour_options?.name ?? null,
						preffered_date: item.preffered_date,
						preffered_timeslot: item.preffered_timeslot,
						confirmed_date: item.confirmed_date,
						confirmed_timeslot: item.confirmed_timeslot,
						reviews: reviewsByTour.get(tourId) || [],
					};
				});

				return {
					id: b.id,
					booking_ref: b.booking_ref,
					booking_status: b.booking_status,
					payment_status: b.payment?.payment_status ?? "PENDING",
					created_at: b.created_at,
					customer_name: b.customer_name ?? undefined,
					tours: tours.sort((a, b) => a.tour_name.localeCompare(b.tour_name)),
				};
			});

			return {
				bookings,
				total: Number(count ?? 0),
				error: null,
			};
		} catch (err) {
			const apiErr =
				err instanceof ApiError
					? err
					: new ApiError("Unexpected error fetching bookings and reviews", 500);
			return {
				bookings: [],
				total: 0,
				error: apiErr,
			};
		}
	}

	/** Add a new review from reviews section in the front panel */
	async addReview(
		tour_id: string,
		booking_id: string,
		rating: number,
		comment: string,
		user_id: string,
	): Promise<void> {
		if (!user_id) {
			throw new ApiError("Unauthorized", 401);
		}

		const { error } = await this.supabase.from(this.REVIEWS_TABLE).insert({
			tour_id,
			booking_id,
			user_id,
			rating,
			comment,
			is_verified: true,
		});

		if (error) {
			throw new ApiError("Failed to add review", 500, [error.message]);
		}
	}

	/** Delete a review from reviews section in the front panel */
	async deleteReview(review_id: number): Promise<void> {
		try {
			await this.supabase.from(this.REVIEWS_TABLE).delete().eq("id", review_id);
		} catch (error) {
			throw error instanceof ApiError ? error : new ApiError("Failed to delete review", 500, []);
		}
	}
}
