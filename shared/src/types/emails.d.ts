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
