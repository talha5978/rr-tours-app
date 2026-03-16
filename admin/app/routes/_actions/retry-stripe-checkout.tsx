import { CheckoutService } from "@workspace/shared/services/checkout.service";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== "POST") {
		return { error: "Method not allowed" };
	}

	const body = await request.json();
	const { bookingRef } = body;

	if (!bookingRef) {
		return { error: "Missing booking reference" };
	}

	const checkoutSvc = new CheckoutService(request);
	const data = await checkoutSvc.resumePayment(bookingRef);

	return data;
};
