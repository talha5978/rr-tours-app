import { render } from "@react-email/render";
import { Await, useLoaderData } from "react-router";
import { Suspense } from "react";
import BookingConfirmationEmail from "@workspace/shared/emails/templates/BookingConfirmationEmail";
import { BookingConfirmationPayload } from "@workspace/shared/types/emails";

export const loader = async () => {
	if (process.env.VITE_ENV !== "development") throw new Error("Email preview is disabled in production.");
	const samplePayload: BookingConfirmationPayload = {
		booking_ref: "WN-ABC123",
		customer_name: "Talha Khan",
		customer_email: "talha@example.com",
		customer_phone: "+923001234567",
		total: 1250.0,
		subtotal: 1000.0,
		taxes: 250.0,
		discount: 0,
		meeting_point: "Hotel lobby, Burj Al Arab entrance at 8:45 AM",
		important_notes:
			"Please bring sunscreen and water bottle.\nNo outside food allowed inside the venue.",
		tours: [
			{
				tour_name: "National Aquarium Abu Dhabi",
				tour_option_name: "Standard Tickets",
				preffered_date: "2026-03-15",
				preffered_timeslot: "10:00 AM",
				confirmed_date: "2026-03-15",
				confirmed_timeslot: "10:30 AM",
				participant_count: 3,
			},
			{
				tour_name: "The Green Planet Dubai",
				tour_option_name: "Family Package",
				preffered_date: "2026-03-16",
				preffered_timeslot: "2:00 PM",
				confirmed_date: "2026-03-16",
				confirmed_timeslot: "2:00 PM",
				participant_count: 2,
			},
		],
		attachments: [
			{
				filename: "booking-voucher.pdf",
				content: "base64stringhere...",
				contentType: "application/pdf",
			},
		],
	};

	// Render to HTML string (for <div dangerouslySetInnerHTML>)
	const html = render(<BookingConfirmationEmail {...samplePayload} />, {
		pretty: true,
	});

	return { html, samplePayload };
};

export default function EmailPreview() {
	const { html } = useLoaderData<typeof loader>();
	if (process.env.VITE_ENV !== "development") return null;

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl">
				<h1 className="text-2xl font-bold mb-6">Email Preview</h1>

				{/* Raw HTML view */}
				<div className="mb-12">
					<h2 className="text-xl mb-3">Rendered HTML</h2>
					<Suspense fallback={"Loading...."}>
						<Await
							resolve={html}
							children={(html) => (
								<div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
									{JSON.stringify(html, null, 2)}
								</div>
							)}
						/>
					</Suspense>
				</div>

				{/* iframe preview (more realistic email client feel) */}
				<div>
					<h2 className="text-xl mb-3">iframe Preview (like real email)</h2>
					<Suspense fallback={"Loading...."}>
						<Await
							resolve={html}
							children={(html) => (
								<iframe
									srcDoc={html}
									className="w-full h-200 border border-gray-300 rounded-lg"
									title="Email Preview"
								/>
							)}
						/>
					</Suspense>
				</div>
			</div>
		</div>
	);
}
