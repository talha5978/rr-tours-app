import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ActionFunctionArgs } from "react-router";
import z from "zod";

const schema = z.object({
	bookingRef: z.string().min(1, "Booking reference is required"),
	cartItems: z
		.array(
			z.object({
				tour_name: z.string().min(1),
				option_name: z.string().optional(),
				price: z.number().nonnegative(),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1, "At least one item is required"),
	successUrl: z.string().url(),
	cancelUrl: z.string().url(),
	customer_email: z.string().email().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== "POST") {
		return {
			sessionId: null,
			error: new ApiError("Invalid request method", 405, []),
		};
	}

	const reqBody = await request.json();

	if (reqBody === null) {
		return {
			sessionId: null,
			error: new ApiError("Invalid request body", 400, []),
		};
	}

	// console.log(data);
	const parseResult = schema.safeParse(reqBody);

	if (!parseResult.success) {
		return {
			sessionId: null,
			error: new ApiError(parseResult.error.message ?? "Invalid data for checkout", 400, [
				parseResult.error,
			]),
		};
	}

	const stripeSvc = new StripeServerService();

	const resp = await stripeSvc.createCheckoutSession({
		bookingRef: parseResult.data.bookingRef,
		cartItems: parseResult.data.cartItems,
		successUrl: parseResult.data.successUrl,
		cancelUrl: parseResult.data.cancelUrl,
		customer_email: parseResult.data.customer_email,
	});

	if (resp.sessionId != null) {
		const bookingSvc = new BookingService(request);
		await bookingSvc.updateBookingCheckoutSessionId(parseResult.data.bookingRef, resp.sessionId);
	}

	return resp;
};
