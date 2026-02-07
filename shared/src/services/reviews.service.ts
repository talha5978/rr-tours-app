import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import type {
	GetTourReviewsOptions,
	GetTourReviewsResp,
	HomePageReviewsResp,
	HomePageTourReview,
	MyReviewsBooking,
	MyReviewsBookings,
	TourReview,
} from "@workspace/shared/types/tour-reviews";
import { AuthService } from "@workspace/shared/services/auth.service";
import { ApiError } from "@workspace/shared/utils/ApiError";

@UseClassMiddleware(loggerMiddleware)
export class ReviewsService extends Service {
	private readonly MAX_ALLOWED_REVIEWS = 5; // PER USER

	/** Check if the user has the added the review or not on the tour */
	async isAddingReviewAvailable(tour_id: string): Promise<boolean> {
		if (!this.currentUser?.id) {
			return false;
		}

		const { data: existingReviews, error: reviewError } = await this.supabase
			.from(this.REVIEWS_TABLE)
			.select("id")
			.eq("tour_id", tour_id)
			.eq("user_id", this.currentUser.id)
			.limit(this.MAX_ALLOWED_REVIEWS);

		if (reviewError) {
			console.error(reviewError);
			return false;
		}

		if (existingReviews && existingReviews.length >= this.MAX_ALLOWED_REVIEWS) {
			return false;
		}

		const { data: bookings, error: bookingError } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select("id, status")
			.eq("tour_id", tour_id)
			.eq("user_id", this.currentUser.id)
			.eq("status", "CONFIRMED")
			.limit(1);

		if (bookingError) {
			console.error(bookingError);
			return false;
		}

		return !!bookings && bookings.length > 0;
	}

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
					full_name: email_resp.user?.user_metadata?.full_name ?? "",
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
						payment_status,
						tour_id,
						tour_name,
						tour_option_name,
						preferred_date,
						preferred_timeslot,
						confirmed_date,
						confirmed_timeslot,
						created_at,
						confirmed_at,
						customer_name,
						reviews:${this.REVIEWS_TABLE}(
							id,
							rating,
							comment,
							created_at
						)
					`,
					{ count: "exact" },
				)
				.eq("booking_status", "CONFIRMED")
				.eq("added_by", userId)
				.order("created_at", { ascending: false })
				.range(from, to);

			if (searchQuery.trim().length > 0) {
				query = query.or(`booking_ref.ilike.%${searchQuery}%,tour_name.ilike.%${searchQuery}%`);
			}

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError("Failed to fetch your bookings and reviews", 500, [error.message]);
			}

			const bookings: MyReviewsBooking[] = (data ?? []).map((b) => ({
				id: b.id,
				booking_ref: b.booking_ref,
				booking_status: b.booking_status,
				payment_status: b.payment_status,
				tour_id: b.tour_id,
				tour_name: b.tour_name,
				tour_option_name: b.tour_option_name,
				preffered_date: b.preferred_date,
				preffered_timeslot: b.preferred_timeslot,
				confirmed_date: b.confirmed_date,
				confirmed_timeslot: b.confirmed_timeslot,
				created_at: b.created_at,
				confirmed_at: b.confirmed_at,
				customer_name: b.customer_name ?? undefined,
				reviews: Array.isArray(b.reviews)
					? b.reviews
							.sort(
								(r1, r2) =>
									new Date(r2.created_at).getTime() - new Date(r1.created_at).getTime(),
							)
							.map((r) => ({
								id: r.id.toString(),
								rating: r.rating,
								comment: r.comment,
								created_at: r.created_at,
							}))
					: [],
			}));

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
