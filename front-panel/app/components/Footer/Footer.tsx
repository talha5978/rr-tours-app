import { Link } from "react-router";
import { Facebook, Heart, Instagram } from "lucide-react";
import type { FPHighLevelCategory } from "@workspace/shared/types/categories";

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
							<Link
								to="#"
								className="rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
							>
								<Instagram className="h-4 w-4" />
							</Link>
							<Link
								to="#"
								className="rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
							>
								<Facebook className="h-4 w-4" />
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
								<Link to="#" className="hover:text-foreground">
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
										to={`/tours?category=${category.id}`}
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
