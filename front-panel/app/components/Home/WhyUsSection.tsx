import { ShieldCheck, Star, Headset, BadgePercent } from "lucide-react";
import { memo } from "react";

const FEATURES = [
	{
		icon: ShieldCheck,
		title: "Trusted & Verified Tours",
		description:
			"Every tour is carefully vetted. What you see is exactly what you get, with no last-minute surprises.",
	},
	{
		icon: Star,
		title: "Top Rated Experiences",
		description:
			"We focus on quality over quantity. Our tours are selected based on real customer satisfaction.",
	},
	{
		icon: Headset,
		title: "Local Support",
		description: "Need help before or after booking? Our local team is always available to assist you.",
	},
	{
		icon: BadgePercent,
		title: "Best Value Pricing",
		description: "Competitive prices with transparent costs. No hidden fees, no confusing terms.",
	},
] as const;

export default function WhyUsSection() {
	return (
		<section className="sm:space-y-6 space-y-4">
			<h2 className="section-heading">Why Choose Us</h2>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{FEATURES.map((feature) => (
					<WhyUsCard key={feature.title} feature={feature} />
				))}
			</div>
		</section>
	);
}

const WhyUsCard = memo(({ feature }: { feature: (typeof FEATURES)[number] }) => {
	const Icon = feature.icon;

	return (
		<div
			key={feature.title}
			className="rounded-xl border-2 shadow-xs p-5 transition hover:shadow-sm cursor-pointer bg-card"
		>
			<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Icon className="h-5 w-5 text-primary" />
			</div>

			<h3 className="mb-1 font-semibold text-lg">{feature.title}</h3>
			<p className="text-sm text-muted-foreground">{feature.description}</p>
		</div>
	);
});
