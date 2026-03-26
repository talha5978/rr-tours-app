import { Form, type LoaderFunctionArgs, useLoaderData, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { bookingByRefQuery } from "~/queries/bookings.q";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import type { FPBookingByRefDetail } from "@workspace/shared/types/booking";
import { AlertCircle } from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const ref = url.searchParams.get("ref") ?? "";
	let booking: FPBookingByRefDetail | null = null;

	if (ref && ref !== "") {
		booking = await bookingByRefQuery({ request, ref });
	}

	return { booking };
};

export default function TrackBookingPage() {
	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("ref") ?? "";

	const { booking } = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle={`${currentQuery ? `${currentQuery} | ` : ""}Track Booking | WanderNest`}
				metaDescription="Track your booking details"
				metaKeywords="Track Booking"
				ogType="article"
			/>

			<div className={`py-${booking ? "10" : "20"} max-w-3xl mx-auto space-y-8`}>
				{/* Search Form */}
				<Card>
					<CardHeader>
						<CardTitle>Track Booking</CardTitle>
						<CardDescription>Enter your booking reference to view details</CardDescription>
					</CardHeader>
					<CardContent>
						<Form method="get" replace className="flex gap-3">
							<Input
								name="ref"
								placeholder="Enter booking reference"
								defaultValue={currentQuery}
								className="flex-1"
							/>
							<Button type="submit">Search</Button>
						</Form>
					</CardContent>
					{currentQuery && !booking && (
						<>
							<Separator />
							<CardContent className="flex gap-2 items-center">
								<AlertCircle className="text-destructive w-4 h-4" />
								<p className="text-destructive text-base">Booking not found.</p>
							</CardContent>
						</>
					)}
				</Card>

				{/* Booking Details */}
				{booking && (
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle>Booking #{booking.booking_ref}</CardTitle>
								<Badge
									variant={
										booking.booking_status === "CONFIRMED"
											? "default"
											: booking.booking_status === "PENDING"
												? "secondary"
												: "destructive"
									}
								>
									{booking.booking_status}
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="space-y-8">
							{/* Customer Info */}
							<div>
								<h3 className="font-semibold mb-3">Customer Information</h3>
								<div className="grid grid-cols-2 gap-y-2 text-sm">
									<p className="text-muted-foreground">Name</p>
									<p>{booking.customer_name}</p>
									<p className="text-muted-foreground">Email</p>
									<p>{booking.customer_email}</p>
									<p className="text-muted-foreground">Phone</p>
									<p>{booking.customer_phone}</p>
								</div>
							</div>

							{/* Booking Items (Multiple Tours) */}
							<div>
								<h3 className="font-semibold mb-4">Booked Tours</h3>
								<div className="space-y-6">
									{booking.booking_items.map((item) => (
										<div key={item.id} className="border rounded-lg bg-card">
											<div className="px-5 pt-5 pb-1">
												<div className="flex justify-between items-start">
													<div>
														<h4 className="font-semibold text-lg">
															{item.tour_name}
														</h4>
														<p className="text-sm text-muted-foreground">
															{item.tour_option_name}
														</p>
													</div>
												</div>

												<div className="mt-3 text-sm">
													<p>
														<strong>Date:</strong>{" "}
														{format(new Date(item.preffered_date!), "PPPP")}
													</p>
													<p>
														<strong>Time:</strong> {item.preffered_timeslot}
													</p>
												</div>
											</div>

											<Separator className="my-4" />

											<div className="px-5 pb-5">
												<h5 className="font-medium mb-2">Participants</h5>
												<div className="space-y-1">
													{item.participants.map((p, i) => (
														<div key={i} className="flex justify-between text-sm">
															<span>
																{p.participant_name}
																{(p?.age_max || 0) - (p?.age_min || 0) > 80
																	? ` (${p.age_min}+) `
																	: p.age_max === 0 && p.age_min === 0
																		? null
																		: ` (${p.age_min}-${p.age_max}) `}
																× {p.quantity}
															</span>
															<span className="font-medium">
																AED {(p.unit_price * p.quantity).toFixed(2)}
															</span>
														</div>
													))}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Pricing Summary */}
							<div>
								<h3 className="font-semibold mb-3">Pricing Summary</h3>
								<div className="grid grid-cols-2 gap-y-2 text-sm">
									<p>Subtotal</p>
									<p className="font-medium text-right">
										{booking.subtotal_amount.toFixed(2)} AED
									</p>
									<p>Discount</p>
									<p className="font-medium text-right">
										{booking.discount.toFixed(2)} AED
									</p>
									<p>Taxes</p>
									<p className="font-medium text-right">{booking.taxes.toFixed(2)} AED</p>
									<p className="font-semibold">Total</p>
									<p className="font-semibold text-right">{booking.total.toFixed(2)} AED</p>
								</div>
							</div>

							<Separator />

							{/* Payment & Timeline */}
							<div className="grid grid-cols-2 gap-8">
								<div>
									<h3 className="font-semibold mb-2">Payment Status</h3>
									<Badge
										variant={booking.payment_status === "PAID" ? "default" : "secondary"}
									>
										{booking.payment_status}
									</Badge>
								</div>

								<div>
									<h3 className="font-semibold mb-2">Timeline</h3>
									<div className="text-sm space-y-1">
										<p>Created: {format(new Date(booking.created_at), "PPPP p")}</p>
										{booking.cancelled_at && (
											<p className="text-destructive">
												Cancelled: {format(new Date(booking.cancelled_at), "PPPP p")}
											</p>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</>
	);
}
