import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CreateBookingInput } from "@workspace/shared/schemas/booking.schema";
import { Database } from "@workspace/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class BookingService extends Service {
	private BOOKING_REF_LENGTH = 10;

	private async generateUniqueBookingRef(): Promise<string> {
		const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

		while (true) {
			let ref = "";

			for (let i = 0; i < this.BOOKING_REF_LENGTH; i++) {
				ref += chars[Math.floor(Math.random() * chars.length)];
			}

			const { count } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.select("id", { count: "exact", head: true })
				.eq("booking_ref", ref);

			if ((count ?? 0) === 0) {
				return ref;
			}
		}
	}

	/** create a booking */
	async createBooking(input: CreateBookingInput): Promise<string> {
		const {
			customer_email,
			customer_name,
			customer_phone,
			tour_id,
			tour_name,
			tour_option_id,
			tour_option_name,
			date,
			timeslot,
			// isOpenDated,
			participants,
			subtotal,
			discount,
			taxes,
			total,
		} = input;

		try {
			// Generate unique booking_ref
			const booking_ref = await this.generateUniqueBookingRef();

			// Prepare booking data
			const bookingData: Database["public"]["Tables"]["bookings"]["Insert"] = {
				booking_ref,
				booking_status: "PENDING",
				tour_id,
				tour_name,
				tour_option_id,
				tour_option_name,
				customer_name,
				customer_email,
				customer_phone,
				payment_status: "UNPAID",
				subtotal_amount: subtotal,
				discount,
				taxes,
				total,
				price_overriden: false,
			};

			bookingData.preferred_date = date;
			bookingData.preferred_timeslot = timeslot;

			// Insert booking
			const { data: booking, error: bookingError } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.insert([bookingData])
				.select("id")
				.single();

			if (bookingError) {
				throw new ApiError("Failed to insert booking", 500, []);
			}

			// Prepare participants data
			const participantsData = participants.map((p) => ({
				booking_id: booking.id,
				participant_type_id: p.participant_type_id,
				quantity: p.quantity,
				unit_price: p.unit_price,
			}));

			// Insert participants
			const { error: participantsError } = await this.supabase
				.from(this.BOOKING_PARTICIPANTS_TABLE)
				.insert(participantsData);

			if (participantsError) {
				await this.supabase.from(this.BOOKINGS_TABLE).delete().eq("id", booking.id);
				throw new ApiError("Failed to insert booking participants", 500, []);
			}

			return booking_ref;
		} catch (error) {
			throw error instanceof ApiError ? error : new ApiError("Failed to create booking", 500, []);
		}
	}
}
