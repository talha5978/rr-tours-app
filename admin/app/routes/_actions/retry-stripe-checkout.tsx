import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import { createSupabaseServerClient } from "@workspace/shared/utils/supabase/supabase.server";
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

	const { supabase } = createSupabaseServerClient(request);

	const { data: booking, error: fetchErr } = await supabase
		.from("bookings")
		.select(
			`id, checkout_session_id, total, booking_ref, tour_id, tour_name, tour_option_name, customer_email, tour_details:tours!inner(cover_image), booking_status, payment_status`,
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
		return { error: "Cannot retry payment. Payment already completed or booking cancelled or refunded." };
	}

	let redirectUrl: string | null = null;
	let newSessionId: string | null = null;

	const stripeServerService = new StripeServerService();

	if (booking.checkout_session_id) {
		// Try to reuse existing session
		const { session } = await stripeServerService.retreiveCheckoutSession(booking.checkout_session_id);

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
			amount: booking.total,
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
		const { error: updateErr } = await supabase
			.from("bookings")
			.update({
				checkout_session_id: sessionId,
				// Set payment status to PENDING (if required)
			})
			.eq("id", booking.id);

		if (updateErr) {
			console.error("Failed to update session ID:", updateErr);
			// still proceed — user can pay, webhook will fix status later
		}

		redirectUrl = url;
		newSessionId = sessionId;
	}

	return {
		success: true,
		url: redirectUrl,
		sessionId: newSessionId || booking.checkout_session_id,
	};
};
