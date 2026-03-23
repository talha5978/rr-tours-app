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

export interface HomePageTourReview {
	comment: string;
	created_at: string;
	id: number;
	rating: number;
	tour: {
		id: string;
		name: string;
		url_key: string;
	};
	user: {
		id: string;
		full_name: string;
		avatar: string | null;
	} | null;
}

export interface HomePageReviewsResp {
	reviews: HomePageReview[];
	error: null | ApiError;
}

export type MyReview = {
	id: number;
	rating: number;
	comment: string | null;
	created_at: string;
};

export type MyReviewTour = {
	tour_id: string;
	tour_name: string;
	tour_option_name: string | null;
	preffered_date: string | null;
	preffered_timeslot: string | null;
	confirmed_date: string | null;
	confirmed_timeslot: string | null;
	reviews: MyReview[];
};

export type MyReviewsBooking = {
	id: string;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	created_at: string;
	customer_name?: string | null;
	tours: MyReviewTour[];
};

export type MyReviewsBookings = {
	bookings: MyReviewsBooking[];
	total: number;
	error: ApiError | null;
};
