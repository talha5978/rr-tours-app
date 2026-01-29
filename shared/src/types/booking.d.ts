import type { Database } from "@workspace/shared/types/supabase";
import { ApiError } from "@workspace/shared/utils/ApiError";

export type FPBookingByRefDetail = {
	admin_note: string | null;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	cancelled_at: string | null;
	confirmed_at: string | null;
	confirmed_date: string | null;
	confirmed_timeslot: string | null;
	created_at: string;
	customer_email: string | null;
	customer_name: string | null;
	customer_phone: string | null;
	discount: number;
	id: string;
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	preferred_date: string | null;
	preferred_timeslot: string | null;
	price_overriden: boolean;
	pricing_note: string | null;
	subtotal_amount: number;
	taxes: number;
	total: number;
	tour_id: string | null;
	tour_name: string | null;
	tour_option_id: number | null;
	tour_option_name: string | null;
	updated_at: string;
	booking_participants: {
		id: string;
		participant: {
			id: number;
			name: string;
			age_max: number;
			age_min: number;
		};
		quantity: number;
		unit_price: number;
	}[];
} | null;

export type HighLevelBooking = {
	id: string;
	booking_ref: string;
	booking_status: Database["public"]["Enums"]["booking_status_enum"];
	payment_status: Database["public"]["Enums"]["payment_status_enum"];
	customer_name: string | null;
	customer_phone: string | null;
	created_at: string;
	tour_id: string | null;
	tour_name: string | null;
	tour_option_id: number | null;
	tour_option_name: string | null;
	preffered_date: string | null;
	preffered_timeslot: string | null;
	confirmed_date: string | null;
	confirmed_timeslot: string | null;
	total: number;
};

export type GetHighLevelBookings = {
	bookings: HighLevelBooking[];
	total: number;
};

export type BookingDetailById = Database["public"]["Tables"]["bookings"]["Row"] & {
	booking_participants: (Database["public"]["Tables"]["booking_participants"]["Row"] & {
		participant_type: Database["public"]["Tables"]["participant_types"]["Row"];
	})[];
};

export type GetBookingDetailByID = {
	booking: BookingDetailById | null;
	error: ApiError | null;
};

export type GetBookingDetailsForConfirm = {
	booking: {
		booking_ref: string;
		customer_name: string;
		customer_email: string;
		customer_phone: string;
		confirmed_timeslot: string;
		confirmed_date: string;
		tour_name: string;
		tour_option_name?: string;
		total_amount: string;
		number_of_participants: number;
	} | null;
	error: ApiError | null;
};
