import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { BriefcaseBusinessIcon, Clock8Icon, MapPinIcon, PhoneIcon } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { CONTACT_NUMBER_1 } from "@workspace/shared/constants/constants";

const contactInfo = [
	{
		title: "Office Hours",
		icon: Clock8Icon,
		description: "Monday-Friday\n8:00 am to 11:00 pm",
	},
	{
		title: "Our Address",
		icon: MapPinIcon,
		description: "802 ABC Rd,Dubai\n96812, UAE",
	},
	{
		title: "Office 2",
		icon: BriefcaseBusinessIcon,
		description: "N/A",
	},
	{
		title: "Get in Touch",
		icon: PhoneIcon,
		description: "+" + CONTACT_NUMBER_1,
	},
];

export const loader = () => {
	return null;
};

export default function ContactUs() {
	return (
		<>
			<MetaDetails
				metaTitle="Contact Us | Top Attractions Dubai"
				metaDescription="We're here to help you with any questions or concerns you may have. Don't hesitate to reach out to us!"
				metaKeywords="Top Attractions Dubia, Contact"
				ogType="article"
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/contact-us`}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/contact-us`}
				ogImage="/contact-us.jpg"
			/>
			<section className="bg-muted py-8 sm:py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="relative mx-auto mb-12 w-fit sm:mb-16 lg:mb-24">
						<h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">Contact Us</h2>
					</div>

					<div className="grid items-center gap-12 lg:grid-cols-2">
						<img
							src="/contact-us.jpg"
							alt="Contact illustration"
							className="size-full rounded-md object-cover max-lg:max-h-70"
						/>

						<div>
							<h3 className="mb-6 text-2xl font-semibold">Happy to help you!</h3>
							<p className="text-muted-foreground mb-10 text-lg font-medium">
								We&apos;re here to help you with any questions or concerns you may have.
								Don&apos;t hesitate to reach out to us!
							</p>

							{/* Contact Info Grid */}
							<div className="grid gap-6 sm:grid-cols-2">
								{contactInfo.map((info, index) => (
									<Card className="border-none shadow-none" key={index}>
										<CardContent className="flex flex-col items-center gap-4 text-center">
											<Avatar className="size-9 border">
												<AvatarFallback className="bg-transparent [&>svg]:size-5">
													<info.icon />
												</AvatarFallback>
											</Avatar>
											<div className="space-y-3">
												<h4 className="text-lg font-semibold">{info.title}</h4>
												<div className="text-muted-foreground text-base font-medium">
													{info.description.split("\n").map((line, idx) => (
														<p key={idx}>{line}</p>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
