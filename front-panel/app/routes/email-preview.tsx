import { render } from "@react-email/render";
import { Await, useLoaderData } from "react-router";
import { Suspense } from "react";
import SoftBookingEmail from "@workspace/shared/emails/templates/SoftBookingCreationEmail";

export const loader = async () => {
	const sampleData = {
		full_name: "Test User",
		email: "test@example.com",
		subject: "Test Subject",
		message: "This is a sample message.\nWith multiple lines.\n\nLooks good?",
	};

	// Render to HTML string (for <div dangerouslySetInnerHTML>)
	const html = render(
		<SoftBookingEmail
			booking_ref="LKSFA234"
			date="2026-02-15"
			total={1250}
			customer_name="Sara Khan"
			customer_email="sara@example.com"
			customer_phone="+971501234567"
			tour_id="tour-abc123"
			tour_name="Dubai Desert Safari with BBQ Dinner"
			tour_option_id={2}
			tour_option_name="Private 4x4"
			timeslot="Afternoon (15:00)"
			isOpenDated={false}
			participants={[
				{ participant_name: "Adult", participant_type_id: 1, quantity: 2, unit_price: 350 },
				{ participant_name: "Child", participant_type_id: 2, quantity: 1, unit_price: 200 },
			]}
			subtotal={900}
			discount={0}
			taxes={0}
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
