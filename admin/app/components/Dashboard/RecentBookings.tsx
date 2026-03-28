import { HighLevelBooking } from "@workspace/shared/types/booking";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export const RecentBookingsCard = ({ recentBookings }: { recentBookings: HighLevelBooking[] }) => {
	return (
		<Card className="border-none shadow-sm">
			<CardHeader>
				<CardTitle className="text-lg font-semibold tracking-tight">Recent Bookings</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent>
				{recentBookings.length === 0 ? (
					<div className="py-8 text-center text-sm text-muted-foreground">
						No recent bookings yet.
					</div>
				) : (
					<div className="space-y-1">
						{recentBookings.map((booking) => (
							<div
								key={booking.id}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
							>
								{/* Left - Booking Info */}
								<div className="space-y-1 min-w-0">
									<span className="text-xs text-muted-foreground">
										#{booking.booking_ref}
									</span>
									<div className="flex items-center gap-3">
										<span className="font-medium text-sm">
											{booking.tours.length <= 2 ? (
												booking.tours.map((tour) => tour.tour_name).join(", ")
											) : (
												<>
													<span>{booking.tours[0].tour_name}</span>
													<span>and {booking.tours.length - 1} more</span>
												</>
											)}
										</span>
										<Badge
											variant={
												booking.booking_status === "CONFIRMED"
													? "default"
													: booking.booking_status === "CANCELLED"
														? "outline"
														: "secondary"
											}
											className={
												booking.booking_status === "PENDING"
													? "bg-warning/20 dark:text-warning text-yellow-700"
													: booking.booking_status === "CANCELLED"
														? "border-2 border-muted-foreground/20"
														: ""
											}
										>
											{booking.booking_status}
										</Badge>
									</div>

									<div className="text-xs text-muted-foreground">
										{booking.customer_name || "Guest"}{" "}
										<span className="hover:text-primary hover:underline underline-offset-4">
											<a
												href={`https://wa.me/${booking.customer_phone}?text=Hi! I am from WanderNest.\nThanks for booking with us.\nYour booking reference is ${booking.booking_ref}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												{booking.customer_phone}
											</a>
										</span>
									</div>
								</div>

								{/* Right - Amount & Date */}
								<div className="flex items-center gap-4 ml-auto">
									<div className="text-right space-y-1">
										<div className="font-medium text-base">
											{booking.total.toFixed(2)} AED
										</div>
									</div>
									<div>
										<Link
											viewTransition
											prefetch="intent"
											to={`/bookings/${booking.id}/${booking.booking_ref}/update`}
										>
											<Button size={"icon"}>
												<ArrowRight />
											</Button>
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
			<Separator />
			<CardContent>
				<div className="w-fit ml-auto">
					<Link to="/bookings" viewTransition prefetch="intent">
						<Button variant={"outline"} size={"sm"}>
							See More
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
};
