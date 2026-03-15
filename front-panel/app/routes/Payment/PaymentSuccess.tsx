import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";

export default function PaymentSuccess() {
	const { bookingRef } = useParams<{ bookingRef: string }>();
	const [searchParams] = useSearchParams();
	const tourName = searchParams.get("tour") || "Your Tour";

	return (
		<>
			<MetaDetails
				metaTitle="Payment Successful | WanderNest"
				metaDescription="See your bookings with us"
			/>
			<div className="container max-w-2xl py-12 md:py-20 mx-auto">
				<Card className="border-green-200 bg-green-50/50 shadow-sm">
					<CardHeader className="text-center pb-2">
						<div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-10 w-10 text-green-600" />
						</div>
						<CardTitle className="text-2xl md:text-3xl font-bold">Payment Successful!</CardTitle>
						<CardDescription className="text-base mt-3 text-muted-foreground">
							Thank you for booking <strong>{tourName}</strong>
						</CardDescription>
					</CardHeader>

					<CardContent className="pt-6 space-y-8">
						<div className="rounded-lg bg-white p-6 shadow-xs text-center">
							<p className="text-lg font-medium mb-2">Booking Reference</p>
							<p className="text-2xl font-bold tracking-wide text-primary">
								{bookingRef || "—"}
							</p>
						</div>

						<div className="text-center space-y-4">
							<p className="text-muted-foreground leading-relaxed">
								Your payment has been processed successfully.
								<br />
								We have sent the booking confirmation and ticket to your email.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
								<Button variant="outline" size="lg" asChild className="min-w-45">
									<Link
										to={`/track-booking?ref=${bookingRef}`}
										viewTransition
										prefetch="viewport"
									>
										View Booking Details
									</Link>
								</Button>

								{/* <Button size="lg" className="min-w-[180px]" disabled>
									<Download className="mr-2 h-4 w-4" />
									Download Ticket
								</Button> */}
							</div>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t bg-muted/40 rounded-b-lg">
						<Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
							<Link to="/" viewTransition prefetch="viewport">
								Back to Home
							</Link>
						</Button>
						<Button size="lg" asChild className="w-full sm:w-auto">
							<Link to="/tours" viewTransition prefetch="viewport">
								Explore More Tours
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		</>
	);
}
