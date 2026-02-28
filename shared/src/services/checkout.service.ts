import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type CreateBookingInput } from "@workspace/shared/schemas/booking.schema";
import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import Stripe from "stripe";

@UseClassMiddleware(loggerMiddleware)
export class CheckoutService extends Service {
	/** Function to be used in the confirm checkout action function */
	async confirmCheckout(input: CreateBookingInput & { added_by: string | null }) {
		let bookingRef: string | null = null;
		let clientSecret: string | null = null;
		let paymentIntentId: string | null = null;

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

			const stripe_svc = new StripeServerService();
			const {
				clientSecret: svc_clientSecret,
				error: paymentIntent_err,
				paymentIntentId: svc_paymentIntentId,
			} = await stripe_svc.createPaymentIntent({
				bookingRef,
				amount: Number(input.total),
				description: "Payment for tour: " + input.tour_name + " for " + input.tour_option_name,
			});

			clientSecret = svc_clientSecret;
			paymentIntentId = svc_paymentIntentId;

			if (paymentIntent_err != null) {
				await bookingSvc.deleteBookingByRef(bookingRef);

				return {
					success: false,
					clientSecret,
					bookingRef,
					error:
						paymentIntent_err instanceof ApiError
							? paymentIntent_err.message
							: "Failed to initiate payment process",
				};
			}

			await this.supabase.from(this.BOOKINGS_TABLE).update({
				payment_ref: paymentIntentId,
			});

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

		if(!paymentIntentId || paymentIntentId === "") {
			throw new ApiError("Payment intent id not found", 500, []);
		}

		const { paymentIntent, error: statusError } =
			await stripeService.retrievePaymentIntent(paymentIntentId);

		if (statusError || paymentIntent == null) throw statusError;

		const paymentIntentStatuscheckers: Stripe.PaymentIntent.Status[] = ["requires_payment_method", "requires_confirmation"];

		if (paymentIntentStatuscheckers.includes(paymentIntent.status)) {
			clientSecret = paymentIntent.client_secret;
		} else if (paymentIntent.status === 'succeeded') {
			throw new ApiError("Payment already completed", 400, []);
		} else if (paymentIntent.status === 'requires_capture') {
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
				description: "Resuming Payment for booking #" + booking.booking_ref + " for tour: " + booking.tour_name + " for " + booking.tour_option_name,
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
}
