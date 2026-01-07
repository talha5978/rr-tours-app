import { Link } from "react-router";
import { Facebook, Heart, Instagram } from "lucide-react";

export default function Footer() {
	return (
		<footer className="border-t bg-background max-container ">
			<div className="mx-auto py-10">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{/* Brand */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
								TA
							</div>
							<span className="text-lg font-semibold">Top Attractions</span>
						</div>

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

					{/* Company */}
					<div className="sm:mx-auto">
						<h4 className="mb-3 text-sm font-semibold">Company</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link to="#" className="hover:text-foreground">
									About Us
								</Link>
							</li>
							<li>
								<Link to="#" className="hover:text-foreground">
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
								<Link to="#" className="hover:text-foreground">
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
				</div>

				{/* Bottom bar */}
				<div className="mt-8 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<p>© {new Date().getFullYear()} Top Attractions. All rights reserved.</p>

					<span className="flex gap-2 items-center">
						<span>Made with care for travelers</span>
						<Heart className="size-4 text-destructive fill-destructive" />
					</span>
				</div>
			</div>
		</footer>
	);
}
