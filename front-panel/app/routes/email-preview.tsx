import { render } from "@react-email/render";
import { Await, useLoaderData } from "react-router";
import { Suspense } from "react";
import BookingConfirmationEmail from "@workspace/shared/emails/templates/BookingConfirmationEmail";

export const loader = async () => {
	const sampleData = {
		full_name: "Test User",
		email: "test@example.com",
		subject: "Test Subject",
		message: "This is a sample message.\nWith multiple lines.\n\nLooks good?",
	};

	// Render to HTML string (for <div dangerouslySetInnerHTML>)
	const html = render(
		<BookingConfirmationEmail
			booking_ref="BK-20260215-7842"
			customer_name="Aisha Malik"
			customer_email="aisha@example.com"
			customer_phone="+971 50 123 4567"
			confirmed_timeslot="Afternoon (15:00)"
			confirmed_date="2026-03-10"
			tour_name="Abu Dhabi Full Day Tour"
			tour_option_name="Private Transfer"
			total_amount={1850}
			number_of_participants={3}
			meeting_point="Hotel lobby – please be ready 15 min early"
			important_notes="Bring passport copy, sunscreen, comfortable shoes.\nNo refunds within 48 hours."
			attachments={[{ filename: "sample_pdf.pdf", content: "base64stringhere..." }]}
		/>,
		{
			pretty: true,
		},
	);

	return { html, sampleData };
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
					<div
						className="border border-gray-300 rounded-lg overflow-hidden bg-white"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
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
