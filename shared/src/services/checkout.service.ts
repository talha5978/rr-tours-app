import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type CreateBookingInput } from "@workspace/shared/schemas/booking.schema";
import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import Stripe from "stripe";
import { type TablesUpdate } from "@workspace/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class CheckoutService extends Service {
	/** Function to be used in the confirm checkout action function */
	async confirmCheckout(input: CreateBookingInput & { added_by: string | null }) {
		let bookingRef: string | null = null;
		let clientSecret: string | null = null;

		try {
			const bookingSvc = await this.createSubService(BookingService);
			try {
				bookingRef = await bookingSvc.createBooking(input);
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

	/** Function to be used in the resume checkout action function for forgotten payments or failed payments */
	async resumePaymentForBooking(bookingRef: string) {
		const { data: booking, error } = await this.supabase
			.from(this.BOOKINGS_TABLE)
			.select("booking_ref, payment_ref, total, tour_name, tour_option_name")
			.eq("booking_ref", bookingRef)
			.maybeSingle();

		if (error || !booking) throw new ApiError("Booking not found", 500, [error || null]);

		let clientSecret: string | null = null;
		let paymentIntentId: string | null = booking.payment_ref;

		const stripeService = new StripeServerService();

		if (!paymentIntentId || paymentIntentId === "") {
			throw new ApiError("Payment intent id not found", 500, []);
		}

		const { paymentIntent, error: statusError } =
			await stripeService.retrievePaymentIntent(paymentIntentId);

		if (statusError || paymentIntent == null) throw statusError;

		const paymentIntentStatuscheckers: Stripe.PaymentIntent.Status[] = [
			"requires_payment_method",
			"requires_confirmation",
		];

		if (paymentIntentStatuscheckers.includes(paymentIntent.status)) {
			clientSecret = paymentIntent.client_secret;
		} else if (paymentIntent.status === "succeeded") {
			throw new ApiError("Payment already completed", 400, []);
		} else if (paymentIntent.status === "requires_capture") {
			throw new ApiError("Payment requires capture – contact support", 500, []);
		}

		if (!clientSecret || clientSecret === "") {
			const {
				clientSecret: newClientSecret,
				paymentIntentId: newPaymentIntentId,
				error: newPiError,
			} = await stripeService.createPaymentIntent({
				amount: booking.total,
				bookingRef: booking.booking_ref,
				description:
					"Resuming Payment for booking #" +
					booking.booking_ref +
					" for tour: " +
					booking.tour_name +
					" for " +
					booking.tour_option_name,
			});

			if (newPiError) throw newPiError;

			clientSecret = newClientSecret;
			paymentIntentId = newPaymentIntentId;

			await this.supabase
				.from(this.BOOKINGS_TABLE)
				.update({ payment_ref: newPaymentIntentId })
				.eq("booking_ref", bookingRef);
		}

		return { clientSecret, paymentIntentId };
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
