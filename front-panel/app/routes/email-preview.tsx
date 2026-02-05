import { render } from "@react-email/render";
import { Await, useLoaderData } from "react-router";
import { Suspense } from "react";
import PasswordResetEmail from "@workspace/shared/emails/templates/PasswordResetEmail";
import AdminLoginOtpEmail from "@workspace/shared/emails/templates/LoginOtpEmail";

export const loader = async () => {
	const sampleData = {
		full_name: "Test User",
		email: "test@example.com",
		subject: "Test Subject",
		message: "This is a sample message.\nWith multiple lines.\n\nLooks good?",
	};

	// Render to HTML string (for <div dangerouslySetInnerHTML>)
	const html = render(<AdminLoginOtpEmail email="hello@gmail.com" code="12390875" />, {
		pretty: true,
	});

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
