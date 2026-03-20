import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";

export default function PaymentCancel() {
	const { bookingRef } = useParams<{ bookingRef: string }>();
	const [searchParams] = useSearchParams();
	const tourName = searchParams.get("tour") || "your selected tour";

	return (
		<>
			<MetaDetails
				metaTitle="Payment Cancelled | WanderNest"
				metaDescription="Restore your booking and pay for the tour to continue"
			/>
			<div className="container max-w-2xl py-12 md:py-20 mx-auto">
				<Card className="border-warning/30 bg-warning/10 shadow-sm">
					<CardHeader className="text-center pb-2">
						<div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
							<XCircle className="h-10 w-10 text-warning" />
						</div>
						<CardTitle className="text-2xl md:text-3xl font-bold">Payment Cancelled</CardTitle>
						<CardDescription className="text-base mt-3 text-muted-foreground">
							No payment was processed for <strong>{tourName}</strong>
						</CardDescription>
					</CardHeader>

					<CardContent className="pt-6 space-y-8">
						<div className="rounded-lg border-2 border-warning bg-warning/20 p-6 shadow-sm text-center">
							<p className="text-lg font-medium mb-2">Booking Reference</p>
							<p className="text-2xl font-bold tracking-wide text-primary">
								{bookingRef || "—"}
							</p>
						</div>

						<div className="text-center space-y-5">
							<p className="text-muted-foreground leading-relaxed">
								Your booking is still saved.
								<br />
								You can complete the payment at any time to confirm your booking.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
								<Button variant="default" size="lg" asChild className="min-w-50">
									<Link to={`/booking/${bookingRef}`}>Retry Payment</Link>
								</Button>

								<Button variant="outline" size="lg" asChild className="min-w-50">
									<Link to="/tours" viewTransition prefetch="viewport">
										<RefreshCw className="mr-2 h-4 w-4" />
										Choose Another Tour
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>

					<CardFooter className="justify-center pt-8 border-t bg-muted/40 rounded-b-lg">
						<Button variant="ghost" size="lg" asChild>
							<Link to="/" viewTransition prefetch="viewport">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Return to Homepage
							</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		</>
	);
}
