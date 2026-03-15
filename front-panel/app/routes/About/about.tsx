import AutoScroll from "embla-carousel-auto-scroll";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Carousel, CarouselContent, CarouselItem } from "~/components/ui/carousel";

export const loader = () => {
	return null;
};

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
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDjrweI1ZN9LIJ22QuWwmbdBUViMSg0CpYMQ&	",
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
		name: "Partner",
		logo: "https://i.pinimg.com/564x/23/30/d9/2330d96d19f458c4c3a962cb6da64d43.jpg",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvzxoxmqS5GrXATd8Cj4pf1Iqm6-KYx_HPAA&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmSsXywYJeIxm9UEn4AeUubDK2P22EDNixxg&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo0bT74bfe1W2IZMqa3WjPOoQJDwoHa_TeYg&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsVCp4kdBL5J5-3TlAVe9bH9TbvgY_z7Nt1Q&s",
	},

	{
		name: "Partner",
		logo: "https://falconhelitours.com/wp-content/uploads/2021/09/cropped-Falcon-tours-logo-1-1.png",
	},

	{
		name: "Partner",
		logo: "https://www.insideburjalarabphotos.com/assets/images/new-logo.png",
	},

	{
		name: "Partner",
		logo: "https://www.cdnlogo.com/logos/s/65/seaworld.svg",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDlST7T3cHvFQp_G414GeOwALrbTpxFK0-hg&s",
	},

	{
		name: "Partner",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Museum_of_the_Future_logo.svg/1200px-Museum_of_the_Future_logo.svg.png",
	},
	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGTnKDmzk5ZYfn8lmuwYiB4coE2s0qnwSC6A&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBnEl9Nurt0qCnDIdckfJ8qA0zJ9Uc5vfjrQ&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc08VGtY38SB--s_gCtJbncvglUDI1z5L9DQ&s",
	},

	{
		name: "Partner",
		logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP8_MJqxiI4RCXvoENm5PAomSZ5wzTD4Zixw&s",
	},

	{
		name: "Partner",
		logo: "https://mir-s3-cdn-cf.behance.net/projects/404/4e1785165133093.Y3JvcCwxMDY4LDgzNSwwLDEwMA.jpg",
	},
];

export default function About() {
	return (
		<>
			<MetaDetails
				metaTitle="About Us | WanderNest"
				metaDescription="Discover who we are - your trusted partner for unforgettable experiences in Dubai and the UAE."
				metaKeywords="About us, WanderNest, Dubai tours, UAE travel"
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
						<div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
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
					<div className="container mx-auto px-5 md:px-8 space-y-10">
						<h2 className="text-center text-sm uppercase tracking-wider text-muted-foreground font-medium">
							Trusted Partners & Platforms
						</h2>

						<Carousel
							opts={{
								align: "start",
								loop: true,
							}}
							plugins={[
								AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: false }),
							]}
							className="w-full"
						>
							<CarouselContent className="-ml-2 md:-ml-4">
								{partners.map((partner) => (
									<CarouselItem
										key={partner.name}
										className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
									>
										<div className="h-20 flex items-center select-none justify-center px-4">
											<img
												src={partner.logo}
												alt={`${partner.name} logo`}
												className="h-18 w-auto"
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
