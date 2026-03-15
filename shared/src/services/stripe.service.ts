import Stripe from "stripe";
import { StripeElements, Stripe as StripeClientInstance } from "@stripe/stripe-js";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { PAYMENT_CURRENCY } from "@workspace/shared/constants/constants";

class StripeService {
	private payment_currency: string;

	constructor() {
		this.payment_currency = PAYMENT_CURRENCY;
	}

	public getPaymentCurrency(): string {
		return this.payment_currency;
	}
}

export class StripeServerService extends StripeService {
	private stripe: Stripe;

	constructor() {
		super();
		if (!process.env.STRIPE_SECRET_KEY) {
			throw new ApiError("Stripe service not configured: missing STRIPE_SECRET_KEY", 500, []);
		}
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	}

	/** Create PaymentIntent (Stripe-specific; call from action) */
	async createPaymentIntent({
		amount,
		bookingRef,
		description,
	}: {
		bookingRef: string;
		amount: number;
		description?: string;
	}): Promise<{ clientSecret: string | null; paymentIntentId: string | null; error: ApiError | null }> {
		try {
			const paymentIntent = await this.stripe.paymentIntents.create({
				amount: Math.round(amount * 100),
				currency: this.getPaymentCurrency(),
				metadata: { bookingRef },
				automatic_payment_methods: { enabled: true },
				description: description ?? undefined,
			});

			return {
				clientSecret: paymentIntent.client_secret,
				paymentIntentId: paymentIntent.id,
				error: null,
			};
		} catch (err: any) {
			return {
				clientSecret: null,
				paymentIntentId: null,
				error:
					err instanceof ApiError
						? err
						: new ApiError("Failed to create PaymentIntent", 500, [err.message]),
			};
		}
	}

	/** Create Checkout Session for Stripe-hosted payment page */
	async createCheckoutSession({
		amount,
		bookingRef,
		tour_name,
		tour_cover_img_url,
		description,
		successUrl,
		cancelUrl,
		customer_email,
		customer_ref,
	}: {
		amount: number;
		bookingRef: string;
		tour_name: string;
		tour_cover_img_url: string;
		description?: string;
		successUrl: string;
		cancelUrl: string;
		customer_email?: string;
		customer_ref?: string;
	}): Promise<{ sessionId: string | null; url: string | null; error: ApiError | null }> {
		try {
			const session = await this.stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: [
					{
						price_data: {
							currency: this.getPaymentCurrency(),
							product_data: {
								name: tour_name,
								description: description || "Tour Booking",
								images: [tour_cover_img_url],
							},
							unit_amount: Math.round(amount * 100),
						},
						quantity: 1,
					},
				],
				mode: "payment",
				customer_email: customer_email ?? undefined,
				client_reference_id: customer_ref ?? undefined,
				success_url: successUrl,
				cancel_url: cancelUrl,
				metadata: { bookingRef },
			});

			return { sessionId: session.id, url: session.url, error: null };
		} catch (err: any) {
			return {
				sessionId: null,
				url: null,
				error:
					err instanceof ApiError
						? err
						: new ApiError(err.message ?? "Failed to create checkout session", 500, [
								err.message,
							]),
			};
		}
	}

	/** Retrieve Checkout Session */
	async retreiveCheckoutSession(
		sessionId: string,
	): Promise<{ session: Stripe.Checkout.Session | null }> {
		const session = await this.stripe.checkout.sessions.retrieve(sessionId);
		return { session };
	}

	/** Retrieve PaymentIntent */
	async retrievePaymentIntent(
		paymentIntentId: string,
	): Promise<{ paymentIntent: Stripe.PaymentIntent | null; error: ApiError | null }> {
		try {
			const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
			return { paymentIntent, error: null };
		} catch (err: any) {
			return {
				paymentIntent: null,
				error:
					err instanceof ApiError
						? err
						: new ApiError("Failed to retrieve PaymentIntent", 500, [err.message]),
			};
		}
	}

	/** Refund Payment */
	async refundPayment({
		paymentIntentId,
		amount,
		reason = "requested_by_customer",
		note,
	}: {
		paymentIntentId: string;
		amount: number;
		reason: Stripe.RefundCreateParams.Reason;
		note: string;
	}): Promise<{ refundId: string | null; error: ApiError | null }> {
		try {
			const refund = await this.stripe.refunds.create({
				payment_intent: paymentIntentId,
				amount: Math.round(amount * 100),
				reason,
				metadata: {
					note,
				},
			});
			return { refundId: refund.id, error: null };
		} catch (err: any) {
			return {
				refundId: null,
				error: err instanceof ApiError ? err : new ApiError("Refund failed", 500, [err.message]),
			};
		}
	}

	/** Cancel Payment */
	async cancelPayment(paymentIntentId: string): Promise<{ error: ApiError | null }> {
		try {
			await this.stripe.paymentIntents.cancel(paymentIntentId);
			return { error: null };
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Cancel failed", 500, [err.message]),
			};
		}
	}
}

export class StripeClientService extends StripeService {
	/** Confirms payment on the Payment page of stripe */
	async confirmPayment({
		elements,
		return_url,
		stripe_instance,
	}: {
		elements: StripeElements;
		return_url: string;
		stripe_instance: StripeClientInstance;
	}) {
		const { error } = await stripe_instance.confirmPayment({
			elements,
			confirmParams: {
				return_url: return_url,
			},
		});

		return error;
	}
}
