import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";

export const loader = () => {
	return null;
};
const faqs = [
	{
		section: "General Information",
		content: [
			{
				qs: "Who are we?",
				ans: "We are a professional tour and travel agency providing guided tours, activities, and travel services.",
			},
			{
				qs: "What services do you offer?",
				ans: "We offer tours, activities, attraction tickets, transportation, and customized travel packages.",
			},
			{
				qs: "Which destinations do you operate in?",
				ans: "We primarily operate in the Dubai and Abu Dhabi regions.",
			},
			{
				qs: "Are you a licensed tour operator?",
				ans: "Yes, we are a licensed and registered tourism company.",
			},
			{
				qs: "Why should I book with you?",
				ans: "We focus on quality service, reliable support, and well-planned travel experiences.",
			},
		],
	},
	{
		section: "Booking & Reservations",
		content: [
			{
				qs: "How can I book a tour?",
				ans: "You can first contact us via phone or WhatsApp to confirm availability and then book online throug h our website.",
			},
			{
				qs: "Is online booking available?",
				ans: "Yes, online booking is available for most tours and activities.",
			},
			{
				qs: "Is my booking confirmed immediately?",
				ans: "As soon as your booking is confirmed we will send you a confirmation message and you can also track your booking status from our website easily with your booking reference number.",
			},
			{
				qs: "Can I modify my booking?",
				ans: "Yes, booking modifications are possible depending on availability and policy. Please inform us in advance.",
			},
			{
				qs: "Is there a minimum number of participants?",
				ans: "Some tours require a minimum number of participants. This will be mentioned during booking.",
			},
		],
	},
	{
		section: "Pricing & Payments",
		content: [
			{
				qs: "What is included in the tour price?",
				ans: "Inclusions vary by tour and are clearly mentioned in the tour details.",
			},
			{
				qs: "Are there any hidden charges?",
				ans: "No, we do not charge hidden fees. All costs are disclosed upfront.",
			},
			{
				qs: "What payment methods do you accept?",
				ans: "We accept online payments, credit/debit cards, and cash where applicable and we will make your payment happen by contacting you through WhatsApp or email.",
			},
			{
				qs: "Are prices per person or per group?",
				ans: "Prices are usually per person unless stated otherwise. We will also let you know if it is per group when we will contact you.",
			},
			{
				qs: "Do children get discounted prices?",
				ans: "Yes, child discounts may apply depending on the tour.",
			},
		],
	},
	{
		section: "Cancellation & Refunds",
		content: [
			{
				qs: "What is your cancellation policy?",
				ans: "Cancellation policies vary by tour and are shared at the time of booking.",
			},
			{
				qs: "Can I cancel my booking?",
				ans: "Yes, bookings can be canceled within the allowed cancellation period.",
			},
			{
				qs: "Will I get a refund if I cancel?",
				ans: "Refund eligibility depends on the cancellation timing and tour policy.",
			},
			{
				qs: "How long does a refund take?",
				ans: "Refunds are usually processed within 7 to 14 working days.",
			},
			{
				qs: "Can I reschedule my tour?",
				ans: "Rescheduling is possible subject to availability and policy. Please inform us in advance.",
			},
		],
	},
	{
		section: "Tour Experience",
		content: [
			{
				qs: "How long does a tour last?",
				ans: "Tour duration varies and is mentioned in the tour description.",
			},
			{ qs: "Are tours guided?", ans: "Yes, most tours are conducted by professional guides." },
			{
				qs: "What languages are tours available in?",
				ans: "Tours are commonly available in English, Arabic and other languages upon request.",
			},
			{
				qs: "Are meals included?",
				ans: "Meals are included only when specified in the tour details.",
			},
			{
				qs: "Is free time included during tours?",
				ans: "Some tours include free time depending on the itinerary.",
			},
		],
	},
	{
		section: "Pick-up & Transportation",
		content: [
			{
				qs: "Do you offer hotel pick-up?",
				ans: "Yes, hotel pick-up and drop-off are included for selected tours.",
			},
			{
				qs: "What areas are covered for pick-up?",
				ans: "Pick-up is available from most hotels within city limits.",
			},
			{ qs: "What time is pick-up?", ans: "Pick-up time is shared after booking confirmation." },
			{
				qs: "What if I miss my pick-up?",
				ans: "Missed pick-ups are usually considered no-shows and may not be refundable.",
			},
		],
	},
	{
		section: "Safety & Insurance",
		content: [
			{
				qs: "Are tours safe?",
				ans: "Yes, all tours follow local safety guidelines and regulations.",
			},
			{
				qs: "Are guides trained?",
				ans: "Yes, our guides are trained and experienced professionals.",
			},
			{
				qs: "Is travel insurance included?",
				ans: "Travel insurance is usually not included unless stated.",
			},
			{
				qs: "Can people with medical conditions join?",
				ans: "Please inform us in advance so we can advise accordingly.",
			},
			{
				qs: "What happens in case of emergency?",
				ans: "Our team and guides are trained to handle emergencies professionally.",
			},
		],
	},
	{
		section: "Desert Safari",
		content: [
			{
				qs: "Is desert safari safe?",
				ans: "Yes, desert safari is safe when conducted by trained drivers.",
			},
			{ qs: "Is dune bashing mandatory?", ans: "No, you can skip dune bashing if you prefer." },
			{ qs: "Is food included?", ans: "Yes, dinner is included in most desert safari packages." },
			{
				qs: "Can children join desert safari?",
				ans: "Yes, children can join, but age restrictions may apply for some activities.",
			},
			{
				qs: "What should I wear?",
				ans: "Comfortable and respectful clothing and closed shoes are recommended.",
			},
		],
	},
	{
		section: "Theme Parks & Attractions",
		content: [
			{
				qs: "Do you provide attraction tickets?",
				ans: "Yes, we provide tickets for major attractions and theme parks.",
			},
			{ qs: "Are tickets refundable?", ans: "Most attraction tickets are non-refundable." },
			{
				qs: "Do tickets include transfers?",
				ans: "Transfers are included only if mentioned in the ticket details.",
			},
			{
				qs: "Are there age or height restrictions?",
				ans: "Some rides have age or height restrictions set by the attraction.",
			},
			{
				qs: "Can I book multiple attractions?",
				ans: "Yes, combo bookings are available for selected attractions.",
			},
		],
	},
	{
		section: "Customer Support",
		content: [
			{
				qs: "How can I contact support?",
				ans: "You can contact us via phone, email, or WhatsApp.",
			},
			{
				qs: "Can I leave a review?",
				ans: "Yes, we encourage customers to share their experience.",
			},
			{
				qs: "How do you handle complaints?",
				ans: "We take feedback seriously and aim to resolve issues promptly.",
			},
			{
				qs: "Do you provide assistance during tours?",
				ans: "Yes, our team is available to assist during your tour.",
			},
		],
	},
];

export default function FaqsPage() {
	return (
		<>
			<MetaDetails
				metaTitle="FAQs | WanderNest"
				metaDescription="Discover who we are, how we operate and what we offer."
				metaKeywords="FAQs, WanderNest, Dubai tours, UAE travel"
				ogType="article"
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/faqs`}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/faqs`}
			/>

			<section className="space-y-8 mx-auto max-w-2xl pb-10">
				<h1 className="text-3xl sm:text-4xl">FAQs</h1>

				<div className="space-y-7">
					{faqs.map((faq, idx) => {
						return (
							<div key={idx} className="space-y-2">
								<h2 className="section-heading">{faq.section}</h2>
								<Accordion type="single" collapsible>
									{faq.content.map((content, idx) => {
										return (
											<AccordionItem key={idx} value={idx.toString()}>
												<AccordionTrigger className="cursor-pointer">
													<h3 className="text-lg font-semibold">{content.qs}</h3>
												</AccordionTrigger>
												<AccordionContent>{content.ans}</AccordionContent>
											</AccordionItem>
										);
									})}
								</Accordion>
							</div>
						);
					})}
				</div>
			</section>
		</>
	);
}
