import type { Database } from "@workspace/shared/types/supabase";
import { ApiError } from "@workspace/shared/utils/ApiError";

export type FPBookingByRefDetail = {
	id: string;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	customer_name: string | null;
	customer_email: string | null;
	customer_phone: string | null;
	created_at: string;
	updated_at: string;
	cancelled_at: string | null;
	subtotal_amount: number;
	discount: number;
	taxes: number;
	total: number;
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	payment_id?: string | null;
	booking_items: Array<{
		id: string;
		tour_option_id: number;
		preffered_date: string | null;
		preffered_timeslot: string | null;
		confirmed_date: string | null;
		confirmed_timeslot: string | null;
		tour_option_name: string | null;
		tour_name: string | null;
		participants: Array<{
			participant_type_id: number;
			quantity: number;
			unit_price: number;
			participant_name: string;
			age_min?: number;
			age_max?: number;
		}>;
	}>;
} | null;

export type HighLevelBooking = {
	id: string;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	customer_name: string | null;
	customer_phone: string | null;
	customer_email: string | null;
	created_at: string | null;
	total: number;
	tours: {
		tour_name: string;
		tour_option_name: string | null;
		preffered_date: string | null;
		preffered_timeslot: string | null;
		confirmed_date: string | null;
		confirmed_timeslot: string | null;
	}[];
};

export type GetHighLevelBookings = {
	bookings: HighLevelBooking[];
	total: number;
};

export type BookingDetailById = Database["public"]["Tables"]["bookings_new"]["Row"] & {
	booking_items: Array<
		Database["public"]["Tables"]["booking_items"]["Row"] & {
			booking_participants_new: Array<
				Database["public"]["Tables"]["booking_participants_new"]["Row"] & {
					participant_type: Database["public"]["Tables"]["participant_types"]["Row"];
				}
			>;
			tour_option_name: string;
			tour_name: string;
		}
	>;
	payment: {
		payment_status: Database["public"]["Enums"]["payment_status_enum"];
	};
};

export type GetBookingDetailByID = {
	booking: BookingDetailById | null;
	error: ApiError | null;
};

export type GetBookingDetailsForConfirm = {
	booking: {
		booking_ref: string;
		customer_name: string | null;
		customer_email: string | null;
		customer_phone: string | null;
		total_amount: string;
		tours: Array<{
			tour_name: string;
			tour_option_name: string | null;
			preffered_date: string | null;
			preffered_timeslot: string | null;
			confirmed_date: string | null;
			confirmed_timeslot: string | null;
			participant_count: number;
		}>;
		total: number;
		subtotal: number;
		discount: number;
		taxes: number;
	} | null;
	error: ApiError | null;
};

export type FrontPanelBooking = {
	id: string;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	total: number;
	created_at: string;
	customer_name?: string | null;
	items: {
		tour_name: string;
		tour_option_name: string | null;
		preffered_date: string | null;
		preffered_timeslot: string | null;
		confirmed_date: string | null;
		confirmed_timeslot: string | null;
	}[];
};

export type FrontPanelBookings = {
	bookings: FrontPanelBooking[];
	total: number;
	error: ApiError | null;
};
