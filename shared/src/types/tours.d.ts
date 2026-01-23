import type { Database, Tables } from "@workspace/shared/types/supabase";

export type SeatType = Database["public"]["Enums"]["timeslot_seat_type"];

export type TourDetailAvailability = Tables<"tour_availabilities"> & {
	slots: Array<
		Tables<"tour_availability_slots"> & {
			time_slot: Tables<"tour_time_slots">;
		}
	>;
};

export type TourDetailOption = Tables<"tour_options"> & {
	prices: Array<
		Tables<"tour_option_prices"> & {
			participant_type: Tables<"participant_types">;
		}
	>;
	availabilities: TourDetailAvailability[];
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
	toBeSoldOutScore: number; // from 0 to 1
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
