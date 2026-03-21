import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type CreateBookingFromCartInput } from "@workspace/shared/schemas/booking.schema";
import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import Stripe from "stripe";
import { type TablesUpdate } from "@workspace/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class CheckoutService extends Service {
	/** Function to be used in the confirm checkout action function */
	async confirmCheckout(input: CreateBookingFromCartInput) {
		if (!input.added_by) {
			return { success: false, clientSecret: null, bookingRef: null, error: "User not found" };
		}

		let bookingRef: string | null = null;
		let clientSecret: string | null = null;

		try {
			const bookingSvc = await this.createSubService(BookingService);
			try {
				bookingRef = await bookingSvc.createBookingFromCart(input);
			} catch (error: any) {
				return {
					success: false,
					clientSecret: null,
					bookingRef,
					error:
						error instanceof ApiError
							? error.message
							: error.message || "Failed to create booking",
				};
			}

			if (bookingRef == null) {
				return {
					success: false,
					clientSecret: null,
					bookingRef,
					error: new ApiError("Failed to create booking", 500, []),
				};
			}

			return { success: true, clientSecret, bookingRef, error: null };
		} catch (error: any) {
			return {
				success: false,
				clientSecret,
				bookingRef,
				error:
					error instanceof ApiError ? error.message : error.message || "Failed to create booking",
			};
		}
	}

	/** Function to be used in the retry stripe checkout action function */
	async resumePayment(bookingRef: string) {
		try {
			// 1. Fetch booking + related items
			const { data: booking, error: fetchErr } = await this.supabase
				.from("bookings_new")
				.select(
					`
					id,
					total,
					payment_id,
					booking_ref,
					customer_email,
					booking_status,
					payment:${this.PAYMENTS_TABLE}!inner (
						payment_status,
						checkout_session_id
					),
					booking_items (
						tour_option_id,
						${this.TOUR_OPTIONS_TABLE}!inner (
							name,
							${this.TOURS_TABLE}!inner (
								name,
								cover_image
							)
						),
						booking_participants_new (
							quantity,
							unit_price,
							${this.PARTICIPANT_TYPES_TABLE}!inner (
								name
							)
						)
					)
					`,
				)
				.eq("booking_ref", bookingRef)
				.single();

			if (fetchErr || !booking) {
				return { error: "Booking not found" };
			}

			// 2. Block retry if already completed or invalid
			if (
				booking.booking_status === "CONFIRMED" ||
				booking.booking_status === "CANCELLED" ||
				booking.payment.payment_status === "PAID" ||
				booking.payment.payment_status === "REFUNDED"
			) {
				return {
					error: "Cannot retry payment. Payment already completed or booking cancelled/refunded.",
				};
			}

			let redirectUrl: string | null = null;
			let newSessionId: string | null = null;

			const stripeServerService = new StripeServerService();

			// 3. Try to reuse existing session if it exists
			if (booking.payment.checkout_session_id) {
				const { session } = await stripeServerService.retreiveCheckoutSession(
					booking.payment.checkout_session_id,
				);

				if (session?.payment_status === "paid") {
					return { error: "Payment has already been completed" };
				}

				if (session?.url) {
					redirectUrl = session.url;
				}
				// else: expired → create new
			}

			// 4. If no valid URL, create fresh checkout session
			if (!redirectUrl) {
				console.log("Generating new checkout session for resume");

				// Build cartItems array (same format as booking creation)
				const cartItems = (booking.booking_items || []).flatMap((item) => {
					const tourName = item.tour_options?.tours?.name || "Tour Experience";
					const optionName = item.tour_options?.name || "";

					return (item.booking_participants_new || []).map((p) => ({
						tour_name: tourName,
						option_name: optionName
							? `${optionName} - ${p.participant_types?.name || "Participant"}`
							: undefined,
						price: p.unit_price,
						quantity: p.quantity,
					}));
				});

				if (cartItems.length === 0) {
					return { error: "No items found in booking" };
				}

				const { sessionId, url, error } = await stripeServerService.createCheckoutSession({
					bookingRef: booking.booking_ref,
					cartItems,
					successUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${booking.booking_ref}/payment-success`,
					cancelUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${booking.booking_ref}/payment-cancel`,
					customer_email: booking.customer_email ?? undefined,
				});

				if (error || !url || !sessionId) {
					return { error: error?.message || "Failed to create payment session" };
				}

				// 5. Update booking with new session ID
				if (booking.payment_id) {
					const { error: updateErr } = await this.supabase
						.from("payments")
						.update({
							checkout_session_id: sessionId,
						})
						.eq("id", booking.payment_id);

					if (updateErr) {
						console.error("Failed to update checkout_session_id:", updateErr);
					}
				}

				redirectUrl = url;
				newSessionId = sessionId;
			}

			return {
				success: true,
				url: redirectUrl,
				sessionId: newSessionId || booking.payment.checkout_session_id,
			};
		} catch (err: any) {
			console.error("Resume payment error:", err);
			return { error: err.message || "Failed to resume payment" };
		}
	}

	/** Function to refund the payment  */
	async refundPayment({
		booking_id,
		amount,
		reason,
		note,
	}: {
		booking_id: string;
		amount: number;
		reason: string;
		note: string;
	}) {
		try {
			// 1. Fetch booking
			const { data: booking, error: fetchErr } = await this.supabase
				.from("bookings_new")
				.select(`total, payment:${this.PAYMENTS_TABLE}!inner(payment_status, id, payment_intent_id)`)
				.eq("id", booking_id)
				.single();

			if (fetchErr || !booking) {
				return {
					success: false,
					error: "Booking not found",
					status: 404,
				};
			}

			if (booking.payment.payment_status !== "PAID") {
				return {
					success: false,
					error: "Only paid bookings can be refunded",
					status: 400,
				};
			}

			if (!booking.payment.payment_intent_id) {
				return {
					success: false,
					error: "Payment intent not found",
					status: 400,
				};
			}

			if (amount > booking.total) {
				return {
					success: false,
					error: `Refund amount cannot exceed paid amount (${booking.total.toFixed(2)} AED)`,
					status: 400,
				};
			}

			const stripeSvc = new StripeServerService();
			const { refundId, error: refundErr } = await stripeSvc.refundPayment({
				paymentIntentId: booking.payment.payment_intent_id,
				amount,
				reason: reason as Stripe.RefundCreateParams.Reason,
				note,
			});

			if (refundErr || !refundId) {
				return {
					success: false,
					error: refundErr?.message || "Refund failed in Stripe",
					status: 500,
				};
			}

			let bookingPayload: TablesUpdate<"bookings_new"> = {
				...(amount === booking.total && { booking_status: "CANCELLED" }),
				...(amount == booking.total && { cancelled_at: new Date().toISOString() }),
			};

			const { error: updateErr } = await this.supabase
				.from("bookings_new")
				.update(bookingPayload)
				.eq("id", booking_id);

			const { error: updatePaymentErr } = await this.supabase
				.from(this.PAYMENTS_TABLE)
				.update({
					payment_status: "REFUNDED",
				})
				.eq("id", booking.payment.id);

			if (updateErr || updatePaymentErr) {
				console.error("Failed to update booking after refund:", updateErr);
				return {
					success: false,
					error: "Failed to update booking after refund. Please update booking manually.",
					status: 500,
				};
			}

			return {
				success: true,
				refundId,
			};
		} catch (error: any) {
			return {
				success: false,
				error: error instanceof ApiError ? error.message : "Failed to process refund",
				status: 500,
			};
		}
	}
}
