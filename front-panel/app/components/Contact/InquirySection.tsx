import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function InquiryBanner({
	heading = "Ready to book your next adventure?",
	details = "Send us a quick inquiry! We’ll help you plan a perfect Dubai experience.",
}) {
	return (
		<section className="w-full rounded-xl bg-linear-to-r from-primary/20 via-primary/10 to-background border-y border-border/50 mt-20">
			<div className="container px-4 md:px-6 py-10 md:py-14 lg:py-16">
				<div className="flex flex-col md:flex-row items-center justify-between gap-8">
					<div className="space-y-3 text-center md:text-left">
						<h2 className="text-2xl md:text-3xl font-bold tracking-tight">{heading}</h2>
						<p className="text-muted-foreground text-md max-w-xl">{details}</p>
					</div>

					<Button asChild size="lg" className="gap-2 whitespace-nowrap min-w-45">
						<Link to="/contact-us" prefetch="intent" viewTransition>
							Get in Touch
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
