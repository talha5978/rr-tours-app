import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type CreateBookingFromCartInput } from "@workspace/shared/schemas/booking.schema";
import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import Stripe from "stripe";
import { type TablesUpdate } from "@workspace/shared/types/supabase";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";

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
		const { data: booking, error: fetchErr } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select(
				`id, checkout_session_id, total, booking_ref, tour_id, tour_name, tour_option_name, customer_email, tour_details:${this.TOURS_TABLE}!inner(cover_image), booking_status, payment_status`,
			)
			.eq("booking_ref", bookingRef)
			.single();

		if (fetchErr || !booking || booking == null) {
			return { error: "Booking not found" };
		}

		if (
			booking.booking_status === "CONFIRMED" ||
			booking.booking_status === "CANCELLED" ||
			booking.payment_status === "PAID" ||
			booking.payment_status === "REFUNDED"
		) {
			return {
				error: "Cannot retry payment. Payment already completed or booking cancelled or refunded.",
			};
		}

		let redirectUrl: string | null = null;
		let newSessionId: string | null = null;

		const stripeServerService = new StripeServerService();

		if (booking.checkout_session_id) {
			// Try to reuse existing session
			const { session } = await stripeServerService.retreiveCheckoutSession(
				booking.checkout_session_id,
			);

			// if payment already paid then return error
			if (session != null && session.payment_status === "paid") {
				return { error: "Tour payment has already paid" };
			}

			if (session != null && session.url) {
				redirectUrl = session.url;
			}
			// else → expired, url = null → proceed to create new
		}

		if (redirectUrl == null) {
			console.log("|| Generating new checkout session");

			// Create fresh session (fallback)
			const { sessionId, url, error } = await stripeServerService.createCheckoutSession({
				bookingRef: booking.booking_ref,
				tour_name: booking.tour_name as string,
				tour_cover_img_url: SUPABASE_IMAGE_BUCKET_PATH + "/" + booking.tour_details.cover_image,
				description: `Payment for tour: ${booking.tour_name} - ${booking.tour_option_name}`,
				successUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${booking.booking_ref}/payment-success?tour=${booking.tour_name as string}`,
				cancelUrl: `${process.env.VITE_MAIN_APP_URL}/booking/${booking.booking_ref}/payment-cancel?tour=${booking.tour_name as string}`,
				customer_email: booking.customer_email ?? undefined,
			});

			if (error || !url || !sessionId) {
				return { error: error?.message || "Failed to create payment session" };
			}

			//  Update DB with new session ID
			const { error: updateErr } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.update({
					checkout_session_id: sessionId,
					// Set payment status to PENDING (if required)
				})
				.eq("id", booking.id);

			if (updateErr) {
				console.error("Failed to update session ID:", updateErr);
			}

			redirectUrl = url;
			newSessionId = sessionId;
		}

		return {
			success: true,
			url: redirectUrl,
			sessionId: newSessionId || booking.checkout_session_id,
		};
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
				.from(this.BOOKINGS_TABLE)
				.select("payment_ref, total, payment_status")
				.eq("id", booking_id)
				.single();

			if (fetchErr || !booking) {
				return {
					success: false,
					error: "Booking not found",
					status: 404,
				};
			}

			if (booking.payment_status !== "PAID") {
				return {
					success: false,
					error: "Only paid bookings can be refunded",
					status: 400,
				};
			}

			if (!booking.payment_ref) {
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
				paymentIntentId: booking.payment_ref!,
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

			let bookingPayload: TablesUpdate<"bookings"> = {
				payment_status: "REFUNDED",
				...(amount === booking.total && { booking_status: "CANCELLED" }),
				...(amount == booking.total && { cancelled_at: new Date().toISOString() }),
			};

			const { error: updateErr } = await this.supabase
				.from(this.BOOKINGS_TABLE)
				.update(bookingPayload)
				.eq("id", booking_id);

			if (updateErr) {
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
