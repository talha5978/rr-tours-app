import { Link } from "react-router";
import { Heart } from "lucide-react";
import type { FPHighLevelCategory } from "@workspace/shared/types/categories";
import { FB_URL, INSTAGRAM_URL } from "@workspace/shared/constants/constants";

export default function Footer({ categories }: { categories: FPHighLevelCategory[] }) {
	return (
		<footer className="border-t bg-background max-container ">
			<div className="mx-auto py-10">
				<div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
					{/* Brand */}
					<div className="space-y-4">
						<span className="text-lg font-semibold">Top Attractions Dubai</span>

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
									prefetch="intent"
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
									prefetch="intent"
								>
									Our Tours
								</Link>
							</li>
							<li>
								<Link to="/faqs" className="hover:text-foreground">
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
								<Link to="/contact-us" className="hover:text-foreground">
									Contact
								</Link>
							</li>
							<li>
								<Link to="#" className="hover:text-foreground">
									Terms & Conditions
								</Link>
							</li>
							<li>
								<Link to="#" className="hover:text-foreground">
									Privacy Policy
								</Link>
							</li>
						</ul>
					</div>

					{/* Tour Categories */}
					<div>
						<h4 className="mb-3 text-sm font-semibold">Tour Categories</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{categories.slice(0, 5).map((category) => (
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
							{categories.length > 5 && (
								<li>
									<Link
										to={`/tours`}
										className="hover:text-foreground"
										title="See More"
										viewTransition
									>
										See More
									</Link>
								</li>
							)}
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-8 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<p>© {new Date().getFullYear()} Top Attractions Dubai. All rights reserved.</p>

					<span className="flex gap-2 items-center">
						<span>Made with care for travelers</span>
						<Heart className="size-4 text-destructive fill-destructive" />
					</span>
				</div>
			</div>
		</footer>
	);
}
