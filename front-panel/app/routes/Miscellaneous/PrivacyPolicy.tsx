import { CONTACT_NUMBER_1, EMAIL_ADDRESS_1 } from "@workspace/shared/constants/constants";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function PrivacyPolicyPage() {
	return (
		<>
			<MetaDetails
				metaTitle="Privacy Policy | WanderNest"
				metaDescription="Our privacy policy explains how we collect, use, and protect your personal information when you use our services."
				metaKeywords="Privacy Policy, Data Protection, WanderNest"
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/privacy-policy`}
			/>

			<section className="container py-12 md:py-20 max-w-4xl mx-auto px-4 md:px-6 space-y-8">
				<Card className="shadow-md border">
					<CardHeader>
						<CardTitle className="text-3xl font-bold text-center md:text-left">
							Privacy Policy
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 text-muted-foreground">
						<p className="text-sm italic text-center md:text-left">
							Last updated:{" "}
							{new Date("2025-12-01").toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
							<p>
								At WanderNest, we value your privacy and are committed to protecting your
								personal information. This Privacy Policy explains how we collect, use,
								disclose, and safeguard your information when you visit our website, book
								tours, or interact with our services. By using our site, you consent to the
								practices described in this policy.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								2. Information We Collect
							</h2>
							<ul className="list-disc pl-5 space-y-2">
								<li>
									<strong>Personal Information:</strong> When you book a tour or create an
									account, we may collect your name, email address, phone number, payment
									information, and billing details.
								</li>
								<li>
									<strong>Usage Data:</strong> We collect information about how you interact
									with our site, such as browser type, pages visited, and time spent on
									pages.
								</li>
								<li>
									<strong>Cookies:</strong> We use cookies to enhance your experience,
									remember preferences, and track usage. You can manage cookie preferences
									through your browser settings.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								3. How We Use Your Information
							</h2>
							<ul className="list-disc pl-5 space-y-2">
								<li>Process bookings and payments for tours and attractions.</li>
								<li>Send booking confirmations, updates, and promotional emails.</li>
								<li>Improve our website and services based on usage data.</li>
								<li>Prevent fraud and ensure security.</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								4. Sharing Your Information
							</h2>
							<p>We may share your information with:</p>
							<ul className="list-disc pl-5 space-y-2">
								<li>Tour providers and partners to fulfill your bookings.</li>
								<li>Payment processors (e.g., Stripe) for secure transactions.</li>
								<li>Legal authorities if required by law.</li>
							</ul>
							<p>We do not sell your personal information to third parties.</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
							<p>
								We use industry-standard security measures, including encryption and
								firewalls, to protect your information. However, no method is 100% secure, so
								we cannot guarantee absolute security.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
							<p>
								You have the right to access, update, or delete your personal information.
								Contact us at {EMAIL_ADDRESS_1} for any requests.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								7. Changes to This Policy
							</h2>
							<p>
								We may update this Privacy Policy from time to time. Any changes will be
								posted on this page with an updated date.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
							<p>
								If you have questions about this policy, contact us at: {EMAIL_ADDRESS_1} or +
								{CONTACT_NUMBER_1}.
							</p>
						</section>
					</CardContent>
				</Card>
			</section>
		</>
	);
}
