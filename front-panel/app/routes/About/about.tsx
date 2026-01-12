import Autoplay from "embla-carousel-autoplay";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";

export const loader = () => {
	return null;
};

export default function About() {
	const partners = [
		{
			name: "TripAdvisor",
			logo: "https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg",
		},
		{
			name: "SkyDive Abu Dhabi",
			logo: "https://www.exponentpe.com/sites/default/files/2021-02/bigbus.png",
		},
		{
			name: "GetYourGuide",
			logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/GetYourGuide_Logo.png",
		},
		{
			name: "At the Top - Burj Khalifa",
			logo: "https://www.prologicfirst.com/wp-content/uploads/2024/10/atthetop.png",
		},
		{
			name: "Qasr Al Watan",
			logo: "https://static.myconnect.ae/-/media/yasconnect/project/ppad/header/logo.svg?w=500",
		},
		{
			name: "WildWadi",
			logo: "",
		},
	];

	return (
		<>
			<MetaDetails
				metaTitle="About Us | Top Attractions Dubai"
				metaDescription="Discover who we are - your trusted partner for unforgettable experiences in Dubai and the UAE."
				metaKeywords="About us, Top Attractions Dubai, Dubai tours, UAE travel"
				ogType="website"
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/about`}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/about`}
			/>

			<div className="min-h-screen bg-card">
				{/* Hero-like intro section */}
				<div className="pt-16 pb-20 md:pt-24 md:pb-28 border-b">
					<div className="container mx-auto px-5 md:px-8 max-w-4xl">
						<h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-6 text-center md:text-left">
							About Us
						</h1>
						<div className="space-y-6 text-gray-700 leading-relaxed text-lg">
							<p>
								Our goal is simple: to help you create memorable travel experiences. For many
								years, we have been carefully crafting tour packages and delivering essential
								tourism services that turn ordinary trips into something special.
							</p>

							<p>
								We are passionate about providing exceptional service at every step of your
								journey. Our dedicated team is here to help you explore Dubai and the Emirates
								with comfort and ease — from futuristic cityscapes to golden deserts and
								stunning natural landscapes.
							</p>

							<p>
								The love for travel keeps us moving forward — constantly improving, listening,
								and evolving. Today we are proud to be a trusted name in the industry,
								offering everything you need for theme parks, desert safaris, city tours, and
								more — all in one place.
							</p>
						</div>
					</div>
				</div>

				{/* Trusted by / Partners section */}
				<div className="py-16 md:py-20 bg-card">
					<div className="container mx-auto px-5 md:px-8">
						<p className="text-center text-sm uppercase tracking-wider text-gray-500 mb-8 font-medium">
							Trusted Partners & Platforms
						</p>

						<Carousel
							opts={{
								align: "start",
								loop: true,
							}}
							plugins={[Autoplay({ delay: 3000 })]}
							className="w-full"
						>
							<CarouselContent className="-ml-2 md:-ml-4">
								{partners.map((partner) => (
									<CarouselItem
										key={partner.name}
										className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
									>
										<div className="h-20 flex items-center justify-center px-4">
											<img
												src={partner.logo}
												alt={`${partner.name} logo`}
												className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
												loading="lazy"
											/>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
						</Carousel>
					</div>
				</div>
			</div>
		</>
	);
}
