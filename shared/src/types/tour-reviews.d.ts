import type { Database } from "@workspace/shared/types/supabase";

export type TourReview = {
	booking_id: string;
	comment: string;
	created_at: string;
	id: number;
	is_verified: boolean;
	rating: number;
	user: {
		id: string;
		full_name: string;
		avatar: string | null;
	} | null;
};

export interface TourReviewStats {
	average_rating: number;
	rating_counts: Record<1 | 2 | 3 | 4 | 5, number>;
	total_reviews: number;
}

export interface ReviewFilters {
	min_rating?: number;
	sort_by?: "date" | "rating";
	sort_order?: "asc" | "desc";
}

export interface GetTourReviewsOptions {
	limit?: number;
	offset?: number;
	filters?: ReviewFilters;
}

export interface GetTourReviewsResp {
	reviews: TourReview[];
	stats: TourReviewStats;
}
