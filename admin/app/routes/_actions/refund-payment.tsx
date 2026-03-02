import type { ActionFunctionArgs } from "react-router";
import { queryClient } from "@workspace/shared/utils/query-client";
import { CheckoutService } from "@workspace/shared/services/checkout.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const booking_id = params.booking_id as string;
	if (!booking_id || booking_id === "") {
		return { success: false, error: "Booking ID is required" };
	}

	let values;
	try {
		values = await request.json();
	} catch {
		return { success: false, error: "Invalid request body" };
	}

	const { amount, reason, refund_details } = values;

	if (
		typeof amount !== "number" ||
		amount <= 0 ||
		!["duplicate", "fraudulent", "requested_by_customer"].includes(reason) ||
		typeof refund_details !== "string" ||
		refund_details.trim().length < 10
	) {
		return { success: false, error: "Invalid refund data" };
	}

	try {
		const checkoutSvc = new CheckoutService(request);
		const res = await checkoutSvc.refundPayment({
			amount,
			booking_id,
			reason,
			note: refund_details,
		});

		await queryClient.invalidateQueries({ queryKey: ["high_level_bookings"] });
		await queryClient.invalidateQueries({ queryKey: ["booking", booking_id] });
		await queryClient.invalidateQueries({ queryKey: ["booking_for_confirmation", booking_id] });

		return new Response(JSON.stringify(res), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error: any) {
		console.error("Refund action failed:", error);

		const errorMessage = error instanceof Error ? error.message : "Failed to process refund";

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
