import type { Database } from "@workspace/shared/types/supabase";

export type MainBarChartData = {
	data: { date: string; bookings: number }[];
	error: null | ApiError;
};

export type BookingForExport = Database["public"]["Tables"]["bookings_new"]["Row"] & {
	booking_items: (Database["public"]["Tables"]["booking_items"]["Row"] & {
		tour_options: {
			name: string;
		}[];
	})[];
	payment: {
		payment_status: Database["public"]["Enums"]["payment_status_enum"];
		paid_at: string | null;
		paid_amount: number;
	};
};
