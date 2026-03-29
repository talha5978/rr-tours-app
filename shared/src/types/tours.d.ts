import type { Database, Tables } from "@workspace/shared/types/supabase";
import { ApiError } from "@workspace/shared/utils/ApiError";

export type SeatType = Database["public"]["Enums"]["timeslot_seat_type"];

export type TourDetailAvailability = Tables<"availability_rules"> & {
	time_slots: Array<Tables<"time_slots"> & { available_seats: number }>;
};

export type TourDetailOption = Tables<"tour_options"> & {
	prices: Array<
		Tables<"tour_option_prices"> & {
			participant_type: Tables<"participant_types">;
		}
	>;
	availability_rules: TourDetailAvailability[];
	availability_overrides: Tables<"availability_overrides">[];
};

export type GetTourDetails = Tables<"tours"> & {
	meta_details: Tables<"meta_details"> | null;
	city: {
		id: number;
		name: string;
		url_key: string;
	} | null;
	tour_category: {
		id: number;
		name: string;
		url_key: string;
	} | null;
	provider: Tables<"activity_providers"> | null;
	cancellation_policy_detail: Tables<"cancellation_policies"> | null;
	tags: Tables<"tour_tags">[];
	tour_options: TourDetailOption[];
	hasGroupPrice?: boolean;
};

export type HighLevelTour = {
	id: string;
	name: string;
	cover_image: string;
	updated_at: string;
	url_key: string;
	isFeatured: boolean;
	isActive: boolean;
	city: {
		id: number;
		name: string;
		url_key: string;
	};
	category: {
		id: number;
		name: string;
		url_key: string;
	};
};

export type GetHighLevelToursResponse = {
	tours: HighLevelTour[];
	total: number;
};

export type GetTourDetailsForUpdate = Tables<"tours"> & {
	meta_details: Tables<"meta_details"> | null;
	city: {
		id: number;
		name: string;
	} | null;
	tour_category: {
		id: number;
		name: string;
	} | null;
	provider: Tables<"activity_providers"> | null;
	cancellation_policy_detail: Tables<"cancellation_policies"> | null;
	tags: Tables<"tour_tags">[];
	tour_options: TourDetailOption[];
};

export type TourUpdationPayload = Database["public"]["Tables"]["tours"]["Update"];

export type AvailabilityOverrideType = Database["public"]["Enums"]["availability_override_type"];

export type ToursListResp = {
	tours: {
		id: string;
		name: string;
	}[];
	total: number;
	error: ApiError | null;
};

export type TourOptionsListResp = {
	tours: {
		id: string;
		name: string;
		tour_options: {
			id: number;
			name: string;
		}[];
	}[];
	total: number;
	error: ApiError | null;
};
