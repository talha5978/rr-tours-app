import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CreateBookingInput, UpdateBookingActionData } from "@workspace/shared/schemas/booking.schema";
import { Database } from "@workspace/shared/types/supabase";
import type {
	BookingDetailById,
	FPBookingByRefDetail,
	FrontPanelBooking,
	FrontPanelBookings,
	GetBookingDetailByID,
	GetBookingDetailsForConfirm,
	GetHighLevelBookings,
	HighLevelBooking,
} from "@workspace/shared/types/booking";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { StripeServerService } from "@workspace/shared/services/stripe.service";

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

	private getDayOfWeek(dateStr: string): number {
		const date = new Date(dateStr);
		const day = date.getDay();
		return day === 0 ? 7 : day;
	}

	async deleteBookingByRef(ref: string): Promise<ApiError | null> {
		const { error } = await this.supabase.from(this.BOOKINGS_TABLE).delete().eq("booking_ref", ref);
		return error ? new ApiError("Failed to delete booking", 500, []) : null;
	}

	/** create a booking */
	async createBooking(input: CreateBookingInput & { added_by: string | null }): Promise<string> {
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
			isOpenDated,
			participants,
			subtotal,
			discount,
			taxes,
			total,
			added_by,
		} = input;

		try {
			if (!isOpenDated) {
				const totalRequested = participants.reduce((sum, p) => sum + p.quantity, 0);
				const { data: booked, error: bookedErr } = await this.supabase
					.from(this.BOOKINGS_TABLE)
					.select(
						`
						id,
						${this.BOOKING_PARTICIPANTS_TABLE} (quantity)
					`,
					)
					.eq("tour_option_id", tour_option_id)
					.eq("preferred_date", date)
					.eq("preferred_timeslot", timeslot)
					.in("booking_status", ["PENDING", "CONFIRMED"]);

				if (bookedErr) throw new ApiError("Failed to check booked capacity", 500);

				const alreadyBooked =
					booked?.reduce(
						(sum, b) => sum + (b.booking_participants?.reduce((s, p) => s + p.quantity, 0) ?? 0),
						0,
					) ?? 0;

				const weekday = await this.getDayOfWeek(date);

				const { data: capacityData, error: capErr } = await this.supabase
					.from(this.AVAILABILITY_RULES_TABLE)
					.select(
						`
						${this.TIMESLOTS_TABLE}!inner (
							id,
							label,
							capacity
						)
					`,
					)
					.eq("tour_option_id", tour_option_id)
					.lte("start_date", date)
					.gte("end_date", date)
					.contains("weekdays", [weekday])
					.single();

				if (capErr || !capacityData) {
					console.error(capErr ?? "No api error");

					throw new ApiError("No availability rule found for this date", 400);
				}

				const matchingSlot = capacityData.time_slots.find((slot) => slot.label === timeslot);

				if (!matchingSlot) {
					throw new ApiError(`Time slot "${timeslot}" not available on ${date}`, 400);
				}

				const maxCapacity = matchingSlot.capacity ?? Infinity;

				// console.log(alreadyBooked, totalRequested, maxCapacity);

				if (alreadyBooked + totalRequested > maxCapacity) {
					throw new ApiError(
						`Not enough capacity available (Only ${maxCapacity - alreadyBooked} left)`,
						409,
						[],
					);
				}
			}

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
				payment_status: "PENDING",
				subtotal_amount: subtotal,
				discount,
				taxes,
				total,
				price_overriden: false,
				added_by: added_by ?? null,
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

	/** Get booking by ref */
	async getBookingByRef(bookingRef: string): Promise<FPBookingByRefDetail> {
		try {
			if (!bookingRef || bookingRef === "") {
				throw new ApiError("Missing booking reference", 400, []);
			}

			const { data, error } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.select(
					`
					*, 
					participants:booking_participants!inner(
						*,
						participant_type:participant_types!inner(
							*
						)
					)
				`,
				)
				.eq("booking_ref", bookingRef)
				.limit(1)
				.maybeSingle();

			if (error) {
				throw new ApiError(error.message, 500, []);
			}

			let booking: FPBookingByRefDetail | null =
				data == null
					? null
					: {
							...data,
							booking_participants: data.participants.map((p) => ({
								id: p.id,
								participant: {
									id: p.participant_type.id,
									name: p.participant_type.name,
									age_max: p.participant_type.age_max,
									age_min: p.participant_type.age_min,
								},
								quantity: p.quantity,
								unit_price: p.unit_price,
							})),
						};

			if (booking && (booking as any).payment_ref != null) {
				(booking as any).payment_ref = null;
			}
			if (booking && booking.admin_note != null) {
				booking.admin_note = null;
			}
			return booking;
		} catch (error) {
			throw error instanceof ApiError ? error : new ApiError("Failed to get booking data", 500, []);
		}
	}

	/** Get high level bookings for admin page */
	@UseMiddleware(verifyUser)
	async getHighLevelBookings(q = "", pageIndex = 0, pageSize = 10): Promise<GetHighLevelBookings> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.BOOKINGS_TABLE)
				.select(
					`
					id, booking_ref, booking_status, payment_status, created_at, tour_id, tour_name, tour_option_id, tour_option_name, preferred_date, preferred_timeslot, confirmed_date, confirmed_timeslot, total, customer_name, customer_phone, customer_email
				`,
					{ count: "exact" },
				)
				.range(from, to)
				.order("created_at", { ascending: false });

			if (q.length > 0) {
				query = query.like("booking_ref", `%${q}%`);
			}

			const { data, error, count } = await query;

			if (error) {
				return { bookings: [], total: 0 };
			}

			let payload: HighLevelBooking[] = data.map((b) => ({
				id: b.id,
				booking_ref: b.booking_ref,
				booking_status: b.booking_status,
				payment_status: b.payment_status,
				created_at: b.created_at,
				tour_id: b.tour_id,
				tour_name: b.tour_name,
				tour_option_id: b.tour_option_id,
				tour_option_name: b.tour_option_name,
				preffered_date: b.preferred_date,
				preffered_timeslot: b.preferred_timeslot,
				confirmed_date: b.confirmed_date,
				confirmed_timeslot: b.confirmed_timeslot,
				total: b.total,
				customer_name: b.customer_name,
				customer_phone: b.customer_phone,
				customer_email: b.customer_email,
			}));

			return { bookings: payload, total: Number(count) };
		} catch (error) {
			return {
				bookings: [],
				total: 0,
			};
		}
	}

	/** Get booking detail for admin page */
	@UseMiddleware(verifyUser)
	async getBookingById(booking_id: string): Promise<GetBookingDetailByID> {
		if (!booking_id || booking_id === "") {
			throw new ApiError("Missing booking id", 400, []);
		}

		const { data, error } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select(
				`
					*,
					${this.BOOKING_PARTICIPANTS_TABLE}!inner(*, ${this.PARTICIPANT_TYPES_TABLE}!inner(*))				`,
			)
			.eq("id", booking_id)
			.limit(1)
			.maybeSingle();

		if (error) {
			return {
				booking: null,
				error: new ApiError(error.message, 500, []),
			};
		}

		// @ts-ignore
		let payload: BookingDetailById = {
			...data,
			booking_participants: data![this.BOOKING_PARTICIPANTS_TABLE].map((p) => ({
				id: p.id,
				booking_id: p.booking_id,
				quantity: p.quantity,
				unit_price: p.unit_price,
				participant_type_id: p.participant_type_id,
				participant_type: p[this.PARTICIPANT_TYPES_TABLE],
			})),
		};

		return {
			booking: payload ?? null,
			error: null,
		};
	}

	/** update booking detail for admin page */
	@UseMiddleware(verifyUser)
	async updateBooking(id: string, input: UpdateBookingActionData): Promise<void> {
		try {
			// Fetch current booking to get existing values if needed
			const { data: currentBooking, error: fetchError } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.select("*")
				.eq("id", id)
				.single();

			if (fetchError || !currentBooking) {
				throw new ApiError("Booking not found", 404, []);
			}

			let payload: Database["public"]["Tables"]["bookings"]["Update"] = {};

			// Check for confirmed at
			let temp_booking_status = currentBooking.booking_status;
			if (input.booking_status !== undefined) {
				temp_booking_status = input.booking_status;
			}

			let temp_payment_status = currentBooking.payment_status;
			if (input.payment_status !== undefined) {
				temp_payment_status = input.payment_status;
			}

			let temp_confirmed_date = currentBooking.confirmed_date;
			if (input.confirmed_date !== undefined) {
				temp_confirmed_date = input.confirmed_date;
			}

			let temp_confirmed_timeslot = currentBooking.confirmed_timeslot;
			if (input.confirmed_time !== undefined) {
				temp_confirmed_timeslot = input.confirmed_time;
			}

			console.log(
				temp_booking_status,
				temp_payment_status,
				temp_confirmed_date,
				temp_confirmed_timeslot,
			);

			// Simple fields
			if (input.booking_status !== undefined) {
				payload.booking_status = input.booking_status;
			}

			if (
				temp_booking_status === "CONFIRMED" &&
				temp_payment_status === "PAID" &&
				temp_confirmed_date !== null &&
				temp_confirmed_timeslot !== null
			) {
				payload.confirmed_at = new Date().toISOString();
			}

			if (input.booking_status === "CANCELLED") {
				payload.cancelled_at = new Date().toISOString();
			}

			if (input.payment_status !== undefined) {
				payload.payment_status = input.payment_status;
			}

			if (input.customer_name !== undefined) {
				payload.customer_name = input.customer_name;
			}

			if (input.customer_email !== undefined) {
				payload.customer_email = input.customer_email;
			}

			if (input.customer_phone !== undefined) {
				payload.customer_phone = input.customer_phone;
			}

			if (input.preffered_date !== undefined) {
				payload.preferred_date = input.preffered_date;
			}

			if (input.preffered_time !== undefined) {
				payload.preferred_timeslot = input.preffered_time;
			}

			if (input.confirmed_date !== undefined) {
				payload.confirmed_date = input.confirmed_date;
			}

			if (input.confirmed_time !== undefined) {
				payload.confirmed_timeslot = input.confirmed_time;
			}

			if (input.admin_note !== undefined) {
				payload.admin_note = input.admin_note;
			}

			let subtotal_amount = currentBooking.subtotal_amount;
			let discount = currentBooking.discount;
			let taxes = currentBooking.taxes;
			let total = currentBooking.total;

			// Handle participants updates and subtotal recalc
			if (input.participants_unit_prices && input.participants_unit_prices.length > 0) {
				payload.price_overriden = true;

				for (const p of input.participants_unit_prices) {
					const { error: updateError } = await this.supabase
						.from(this.BOOKING_PARTICIPANTS_TABLE)
						.update({
							quantity: p.quantity,
							unit_price: p.unit_price,
						})
						.eq("id", p.booking_participant_id);

					if (updateError) {
						throw new ApiError("Failed to update participant", 500, []);
					}
				}

				// Recalc subtotal from updated participants
				const { data: updatedParticipants, error: fetchPartsError } = await this.supabase
					.from(this.BOOKING_PARTICIPANTS_TABLE)
					.select("quantity, unit_price")
					.eq("booking_id", id);

				if (fetchPartsError) {
					throw new ApiError("Failed to fetch updated participants", 500, []);
				}

				subtotal_amount = updatedParticipants.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
				payload.subtotal_amount = subtotal_amount;
			}

			// Discount & Taxes
			if (input.discount !== undefined) {
				discount = input.discount;
				payload.discount = discount;
			}

			if (input.taxes !== undefined) {
				taxes = input.taxes;
				payload.taxes = taxes;
			}

			// Recalc total if any pricing changed
			if (input.participants_unit_prices || input.discount !== undefined || input.taxes !== undefined) {
				total = subtotal_amount - discount + taxes;
				payload.total = total;

				// If total is changed then session_id needs to be reset to force a new checkout session
				payload.checkout_session_id = null;
			}

			// console.log(payload);

			// Perform update if payload has changes
			if (Object.keys(payload).length > 0) {
				const { error: updateError } = await this.supabase
					.from(this.BOOKINGS_TABLE)
					.update(payload)
					.eq("id", id);

				if (updateError) {
					throw new ApiError("Failed to update booking", 500, []);
				}
			}

			if (
				input.payment_status === "CANCELLED" &&
				currentBooking.payment_ref !== null &&
				currentBooking.payment_ref.length > 0
			) {
				const stripeSvc = new StripeServerService();
				await stripeSvc.cancelPayment(currentBooking.payment_ref);
			}
		} catch (error) {
			throw error instanceof ApiError ? error : new ApiError("Failed to update booking", 500, []);
		}
	}

	/** Update booking checkout session id */
	async updateBookingCheckoutSessionId(
		bookingRef: string,
		checkout_session_id: string,
	): Promise<{ error: ApiError | null }> {
		const { error } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.update({
				checkout_session_id: checkout_session_id.trim(),
			})
			.eq("booking_ref", bookingRef);

		return { error: error ? new ApiError("Failed to update checkout session id", 500, [error]) : null };
	}

	/** get booking details for confirmation email dialog */
	async getBookingForConfirmation(booking_id: string): Promise<GetBookingDetailsForConfirm> {
		if (!booking_id || booking_id === "") {
			throw new ApiError("Missing booking id", 400, []);
		}

		const { data, error } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select(
				`
					booking_ref,
					customer_name,
					customer_email,
					customer_phone,
					confirmed_date,
					confirmed_timeslot,
					tour_name,
					tour_option_name,
					total_amount:total.sum(),
					${this.BOOKING_PARTICIPANTS_TABLE}!inner(id)
				`,
			)
			.eq("id", booking_id)
			.limit(1)
			.maybeSingle();

		if (error) {
			return {
				booking: null,
				error: new ApiError(error.message, 500, []),
			};
		}

		let payload: GetBookingDetailsForConfirm["booking"] = {
			confirmed_date: data?.confirmed_date ?? "N/A",
			confirmed_timeslot: data?.confirmed_timeslot ?? "N/A",
			customer_email: data?.customer_email ?? "N/A",
			customer_name: data?.customer_name ?? "N/A",
			customer_phone: data?.customer_phone ?? "N/A",
			tour_name: data?.tour_name ?? "N/A",
			tour_option_name: data?.tour_option_name ?? "N/A",
			booking_ref: data?.booking_ref ?? "N/A",
			number_of_participants:
				data?.booking_participants && data?.booking_participants.length > 0
					? data?.booking_participants.length
					: 0,
			total_amount: data?.total_amount.toString() ?? "N/A",
		};

		return {
			booking: payload ?? null,
			error: null,
		};
	}

	/**
	 * Get minimal booking list for the current authenticated user
	 */
	async getMyBookings(userId: string, pageIndex = 0, pageSize = 10): Promise<FrontPanelBookings> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			if (userId === null || userId === "") {
				throw new ApiError("Failed to fetch your bookings", 500, []);
			}

			let query = this.supabase
				.from(this.BOOKINGS_TABLE)
				.select(
					`
						id,
						booking_ref,
						booking_status,
						payment_status,
						tour_id,
						tour_name,
						tour_option_name,
						preferred_date,
						preferred_timeslot,
						confirmed_date,
						confirmed_timeslot,
						total,
						created_at,
						confirmed_at,
						customer_name
					`,
					{ count: "exact" },
				)
				.eq("added_by", userId)
				.order("created_at", { ascending: false })
				.range(from, to);

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError("Failed to fetch your bookings", 500, [error.message]);
			}

			const bookings: FrontPanelBooking[] = (data ?? []).map((b) => ({
				id: b.id,
				booking_ref: b.booking_ref,
				booking_status: b.booking_status,
				payment_status: b.payment_status,
				tour_id: b.tour_id,
				tour_name: b.tour_name,
				tour_option_name: b.tour_option_name,
				preffered_date: b.preferred_date,
				preffered_timeslot: b.preferred_timeslot,
				confirmed_date: b.confirmed_date,
				confirmed_timeslot: b.confirmed_timeslot,
				total: b.total,
				created_at: b.created_at,
				confirmed_at: b.confirmed_at,
				customer_name: b.customer_name ?? undefined,
			}));

			return {
				bookings,
				total: Number(count ?? 0),
				error: null,
			};
		} catch (err) {
			const apiErr =
				err instanceof ApiError ? err : new ApiError("Unexpected error fetching bookings", 500);
			return {
				bookings: [],
				total: 0,
				error: apiErr,
			};
		}
	}
}
