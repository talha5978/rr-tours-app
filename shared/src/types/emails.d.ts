export interface SoftBookingEmailProps {
	booking_ref: string;
	date: string;
	total: number;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	tour_id: string;
	tour_name: string;
	tour_option_id: number;
	tour_option_name: string;
	timeslot: string;
	isOpenDated: boolean;
	participants: {
		participant_name: string;
		participant_type_id: number;
		quantity: number;
		unit_price: number;
	}[];
	subtotal: number;
	discount: number;
	taxes: number;
}

export interface BookingConfirmationPayload {
	booking_ref: string;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	confirmed_timeslot: string;
	confirmed_date: string;
	tour_name: string;
	tour_option_name?: string;
	total_amount: number;
	number_of_participants: number;
	meeting_point?: string;
	important_notes?: string;
	attachments?: Array<{
		filename: string;
		content: Buffer | string; // Buffer from fetch or string (base64)
		contentType?: string; // defaults to 'application/pdf'
	}>;
}
