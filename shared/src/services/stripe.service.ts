import Stripe from "stripe";
import { StripeElements, Stripe as StripeInstance } from "@stripe/stripe-js";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { PAYMENT_CURRENCY } from "@workspace/shared/constants/constants";

class StripeService {
	payment_currency: string;

	constructor() {
		this.payment_currency = PAYMENT_CURRENCY;
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
				currency: this.payment_currency,
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
		stripe_instance: StripeInstance;
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
