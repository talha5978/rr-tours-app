import { EMAIL_ADDRESS_1 } from "@workspace/shared/constants/constants";
import { Link } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function TermsOfUsePage() {
	return (
		<>
			<MetaDetails
				metaTitle="Terms of Use | WanderNest"
				metaDescription="Our terms of use outline the rules and guidelines for using our website and services."
				metaKeywords="Terms of Use, User Agreement, WanderNest"
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/terms-of-use`}
			/>

			<section className="container py-12 md:py-20 max-w-4xl mx-auto px-4 md:px-6 space-y-8">
				<Card className="shadow-md border">
					<CardHeader>
						<CardTitle className="text-3xl font-bold text-center md:text-left">
							Terms of Use
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
							<h2 className="text-xl font-semibold text-foreground mb-3">
								1. Acceptance of Terms
							</h2>
							<p>
								By accessing or using WanderNest's website and services, you agree to be bound
								by these Terms of Use. If you do not agree, please do not use our services.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">2. User Accounts</h2>
							<p>
								You may need to create an account to book tours. You are responsible for
								maintaining the confidentiality of your account information and for all
								activities that occur under your account.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								3. Bookings and Payments
							</h2>
							<p>
								All bookings are subject to availability. Payments are processed securely
								through third-party providers. Once a booking is confirmed, it is
								non-transferable.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								4. Cancellations and Refunds
							</h2>
							<p>
								Cancellation policies vary by tour. Please check the specific tour's policy
								before booking. Refunds, if applicable, will be processed within 7–10 business
								days.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">5. User Conduct</h2>
							<p>
								You agree not to use our site for any unlawful purpose, to post false reviews,
								or to infringe on intellectual property rights.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								6. Intellectual Property
							</h2>
							<p>
								All content on our site, including images, text, and logos, is owned by Top
								Attractions Dubai or its partners. Unauthorized use is prohibited.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								7. Limitation of Liability
							</h2>
							<p>
								We are not liable for any indirect, incidental, or consequential damages
								arising from your use of our services. Our liability is limited to the amount
								paid for the booking.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">8. Governing Law</h2>
							<p>These terms are governed by the laws of the United Arab Emirates.</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">
								9. Changes to Terms
							</h2>
							<p>
								We may update these Terms of Use from time to time. Continued use of our
								services constitutes acceptance of the changes.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
							<span>
								<p>
									For questions about these terms, contact us at
									{EMAIL_ADDRESS_1}
								</p>
								<Link to={"/contact-us"} prefetch="intent" viewTransition>
									<p className="hover:underline underline-offset-2">
										Or send and inquiry using the contact form.
									</p>
								</Link>
							</span>
						</section>
					</CardContent>
				</Card>
			</section>
		</>
	);
}
