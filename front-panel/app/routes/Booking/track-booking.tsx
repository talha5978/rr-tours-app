import { Form, type LoaderFunctionArgs, useLoaderData, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { queryClient } from "@workspace/shared/utils/query-client";
import { bookingByRefQuery } from "~/queries/bookings.q";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const ref = url.searchParams.get("ref") ?? "";
	let booking = null;

	if (ref && ref !== "") {
		booking = await queryClient.fetchQuery(bookingByRefQuery({ request, ref }));
	}

	return {
		booking,
	};
};

export default function TrackBookingPage() {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("ref") ?? "";

	const { booking } = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle={`${currentQuery !== "" ? `${currentQuery} | ` : ""}Track Booking | Top Attractions Dubai`}
				metaDescription={"Track Tour Booking Page"}
				metaKeywords="Track Booking"
				ogType="article"
			/>
			<div className={`py-${booking ? "10" : "20"} max-w-lg mx-auto space-y-6`}>
				<Card>
					<CardHeader>
						<CardTitle>
							<h1 className="text-xl font-bold">Track Booking</h1>
						</CardTitle>
						<CardDescription>
							Please enter booking reference to track your booking
						</CardDescription>
					</CardHeader>
					<Separator />
					<CardContent>
						<Form method="get" action="/track-booking" className="min-w-full">
							<div className="flex flex-col min-[30rem]:flex-row gap-2 w-full max-w-xl mx-auto">
								<Input
									type="text"
									name="ref"
									placeholder={"Search by booking reference"}
									className="bg-white/90!"
									defaultValue={currentQuery}
									maxLength={10}
								/>
								<Button className="w-full min-[30rem]:w-auto" type="submit">
									Search
								</Button>
							</div>
						</Form>
					</CardContent>
				</Card>

				{booking && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex justify-between items-center">
								Booking Details
								<Badge
									variant="outline"
									className={
										booking.booking_status === "CONFIRMED"
											? "bg-green-100 text-green-800"
											: booking.booking_status === "PENDING"
												? "bg-yellow-100 text-yellow-800"
												: "bg-red-100 text-destructive"
									}
								>
									{booking.booking_status}
								</Badge>
							</CardTitle>
							<CardDescription>#{booking.booking_ref}</CardDescription>
						</CardHeader>
						<Separator />
						<CardContent className="space-y-6 pt-4">
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">
									Customer Information
								</h2>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<h3>Name</h3>
									<span className="font-medium">{booking.customer_name ?? "N/A"}</span>
									<h3>Email</h3>
									<span className="font-medium">{booking.customer_email ?? "N/A"}</span>
									<h3>Phone</h3>
									<span className="font-medium">{booking.customer_phone ?? "N/A"}</span>
								</div>
							</div>
							<Separator />
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">Tour Details</h2>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<h3>Tour</h3>
									<span className="font-medium">{booking.tour_name ?? "N/A"}</span>
									<h3>Option</h3>
									<span className="font-medium">{booking.tour_option_name ?? "N/A"}</span>
									<h3>Preferred Date</h3>
									<span className="font-medium">
										{booking.preferred_date
											? format(new Date(booking.preferred_date), "PPPP")
											: "N/A"}
									</span>
									<h3>Preferred Time</h3>
									<span className="font-medium">{booking.preferred_timeslot ?? "N/A"}</span>
									<h3>Confirmed Date</h3>
									<span className="font-medium">
										{booking.confirmed_date
											? format(new Date(booking.confirmed_date), "PPPP")
											: "N/A"}
									</span>
									<h3>Confirmed Time</h3>
									<span className="font-medium">{booking.confirmed_timeslot ?? "N/A"}</span>
								</div>
							</div>
							<Separator />
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">Participants</h2>
								{booking.booking_participants.length > 0 ? (
									<div className="space-y-1 text-sm">
										{booking.booking_participants.map((participant, index) => (
											<div key={index} className="flex *:flex-1 justify-between">
												<span>
													{participant.participant.name} ({participant.quantity} x{" "}
													{participant.unit_price} AED)
												</span>
												<span className="font-medium mr-auto">
													{(participant.quantity * participant.unit_price).toFixed(
														2,
													)}{" "}
													AED
												</span>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No participants found.</p>
								)}
							</div>
							<Separator />
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">Pricing</h2>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<h3>Subtotal</h3>
									<span className="font-medium">
										{booking.subtotal_amount.toFixed(2)} AED
									</span>
									<h3>Discount</h3>
									<span className="font-medium">{booking.discount.toFixed(2)} AED</span>
									<h3>Taxes</h3>
									<span className="font-medium">{booking.taxes.toFixed(2)} AED</span>
									<h3>Total</h3>
									<span className="font-medium">{booking.total.toFixed(2)} AED</span>
								</div>
							</div>
							<Separator />
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">Payment</h2>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<h3>Status</h3>
									<Badge
										variant="outline"
										className={
											booking.payment_status === "UNPAID"
												? "bg-red-100 text-destructive"
												: booking.payment_status === "REFUNDED"
													? ""
													: booking.payment_status === "PARTIAL"
														? "bg-yellow-100 text-yellow-800"
														: "bg-green-100 text-green-800"
										}
									>
										{booking.payment_status}
									</Badge>
								</div>
							</div>
							<Separator />
							<div className="space-y-2">
								<h2 className="text-sm font-medium text-muted-foreground">Timeline</h2>
								<div className="grid grid-cols-[2.5fr_3fr] gap-2 text-sm">
									<h3>Created At</h3>
									<span className="font-medium">
										{format(new Date(booking.created_at), "PPPP p")}
									</span>
									<h3>Updated At</h3>
									<span className="font-medium">
										{format(new Date(booking.updated_at), "PPPP p")}
									</span>
									{booking.confirmed_at && (
										<>
											<h3>Confirmed At</h3>
											<span className="font-medium">
												{booking.confirmed_at
													? format(new Date(booking.confirmed_at), "PPPP p")
													: "N/A"}
											</span>
										</>
									)}
									{booking.cancelled_at && (
										<>
											<h3>Confirmed At</h3>
											<span className="font-medium">
												{booking.cancelled_at
													? format(new Date(booking.cancelled_at), "PPPP p")
													: "N/A"}
											</span>
										</>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</>
	);
}
