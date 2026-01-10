import type { Database } from "@workspace/shared/types/supabase";

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
	payment_ref: string | null;
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
