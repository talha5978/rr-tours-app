import { Link } from "react-router";
import { Heart } from "lucide-react";
import type { FPHighLevelCategory } from "@workspace/shared/types/categories";
import { FB_URL, INSTAGRAM_URL } from "@workspace/shared/constants/constants";

export default function Footer({ categories }: { categories: FPHighLevelCategory[] }) {
	return (
		<footer className="border-t bg-background max-container">
			<div className="mx-auto py-10">
				<div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
					{/* Brand */}
					<div className="space-y-4">
						{/* Logo */}
						<Link to="/" viewTransition prefetch="intent">
							<div className="w-32 h-fit mb-2">
								<img src="/logo.png" className="w-32 h-fit" alt="WanderNest" />
							</div>
						</Link>

						<span className="text-lg font-semibold">WanderNest</span>

						<p className="max-w-sm text-sm text-muted-foreground">
							Trusted tours, handpicked experiences, and easy bookings for memorable trips.
						</p>

						<div className="flex gap-3">
							<Link to={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
								<div>
									<img
										src="https://cdn.iconscout.com/icon/free/png-256/free-instagram-logo-icon-svg-download-png-1583142.png?f=webp&amp;w=128"
										alt="Instagram"
										className="w-6 h-6"
									/>
								</div>
							</Link>
							<Link to={FB_URL} target="_blank" rel="noopener noreferrer">
								<div>
									<img
										src="https://cdn.iconscout.com/icon/free/png-256/free-facebook-logo-icon-svg-download-png-721949.png?f=webp&w=256"
										alt="Facebook"
										className="w-6 h-6 rounded-md"
									/>
								</div>
							</Link>
						</div>
					</div>

					{/* Agency */}
					<div>
						<h4 className="mb-3 text-sm font-semibold">Agency</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link
									to="/about"
									viewTransition
									prefetch="viewport"
									className="hover:text-foreground"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									to="/tours"
									className="hover:text-foreground"
									viewTransition
									prefetch="viewport"
								>
									Our Tours
								</Link>
							</li>
							<li>
								<Link
									to="/faqs"
									className="hover:text-foreground"
									prefetch="viewport"
									viewTransition
								>
									FAQs
								</Link>
							</li>
						</ul>
					</div>

					{/* Support */}
					<div>
						<h4 className="mb-3 text-sm font-semibold">Support</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link
									to="/contact-us"
									prefetch="viewport"
									viewTransition
									className="hover:text-foreground"
								>
									Contact
								</Link>
							</li>
							<li>
								<Link
									to="terms-of-usage"
									prefetch="viewport"
									viewTransition
									className="hover:text-foreground"
								>
									Terms of Usage
								</Link>
							</li>
							<li>
								<Link
									to="/privacy-policy"
									prefetch="viewport"
									viewTransition
									className="hover:text-foreground"
								>
									Privacy Policy
								</Link>
							</li>
						</ul>
					</div>

					{/* Tour Categories */}
					<div>
						<h4 className="mb-3 text-sm font-semibold">Tour Categories</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{categories.map((category) => (
								<li key={category.id}>
									<Link
										to={`/tours?categories=${category.id}`}
										className="hover:text-foreground"
										viewTransition
										title={category.name}
									>
										{category.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom bar - Payment logos added here */}
				<div className="mt-8 flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
						<p>© {new Date().getFullYear()} WanderNest. All rights reserved.</p>

						<span className="flex gap-2 items-center">
							<span>Made with care for travelers</span>
							<Heart className="size-4 text-destructive fill-destructive" />
						</span>
					</div>

					<div className="flex items-center gap-4 max-sm:mt-5 sm:gap-5 justify-center sm:justify-end flex-wrap">
						<img
							src="https://cdn-icons-png.flaticon.com/512/349/349221.png"
							alt="Visa"
							className="sm:h-6 h-8 w-auto"
							loading="lazy"
						/>
						<img
							src="https://cdn-icons-png.flaticon.com/512/349/349228.png"
							alt="Mastercard"
							className="sm:h-6 h-8 w-auto"
							loading="lazy"
						/>
						<img
							src="https://www.mastercard.com/brandcenter/us/en/download-artwork/_jcr_content/root/container/container_1578756628/container_copy/container/container/teaser2.coreimg.png/1751029719778/mastercard-symbol-square-black.png"
							className="sm:h-6 h-8 w-auto"
							alt="Master Card"
							loading="lazy"
						/>
						<img
							src="https://cdn-icons-png.freepik.com/512/6124/6124998.png"
							alt="G Pay"
							className="h-8 w-auto"
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		</footer>
	);
}
