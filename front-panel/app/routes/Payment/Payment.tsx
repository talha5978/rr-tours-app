import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
	isRouteErrorResponse,
	Link,
	useLoaderData,
	useRouteError,
	type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { memo, Suspense, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Loader2, CheckCircle2, XCircle, ServerCrash } from "lucide-react";
import { StripeClientService } from "@workspace/shared/services/stripe.service";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { queryClient } from "@workspace/shared/utils/query-client";
import { resumePaymentQuery } from "~/queries/checkout.q";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const booking_ref = url.searchParams.get("booking_ref");

	if (!booking_ref) {
		throw new Response(JSON.stringify({ message: "Missing booking reference", booking_ref: null }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const { clientSecret } = await queryClient.fetchQuery(resumePaymentQuery({ booking_ref, request }));
		return { booking_ref, client_secret: clientSecret };
	} catch (error: any) {
		// Throw with context
		throw new Response(
			JSON.stringify({
				message: error.message || "Payment session error",
				booking_ref,
			}),
			{ status: error.statusCode || 500, headers: { "Content-Type": "application/json" } },
		);
	}
};

export function ErrorBoundary() {
	const error = useRouteError();

	let message = "Something went wrong. Please try again.";
	let title = "Payment Issue";
	let bookingRef = "N/A";

	if (isRouteErrorResponse(error) && error.data) {
		const data = typeof error.data === "string" ? JSON.parse(error.data) : error.data;
		message = data.message || message;
		bookingRef = data.booking_ref || "N/A";

		if (error.status === 400 && message.includes("Missing booking reference")) {
			message = "Invalid link. Booking reference is missing.";
		}
	} else if (error instanceof Error) {
		const errMsg = error.message.toLowerCase();

		if (errMsg.includes("already completed") || errMsg.includes("already paid")) {
			message = "This booking has already been paid. No further payment is required.";
			title = "Payment Already Completed";
		} else if (errMsg.includes("expired") || errMsg.includes("invalid") || errMsg.includes("not found")) {
			message = "This payment session has expired or is no longer valid. Please start a new booking.";
		} else {
			message = errMsg;
		}
	}

	// console.log(title, message);

	return (
		<div className="max-w-xl mx-auto mt-16 p-8 bg-card rounded-xl shadow-md text-center">
			<div className="flex flex-col items-center gap-2">
				<XCircle className="h-8 w-8 text-destructive" />
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="text-muted-foreground max-w-md mx-auto">{message}</p>

				<p className="text-sm text-muted-foreground mt-2">
					Booking reference: <strong>#{bookingRef}</strong>
				</p>

				<div className="flex flex-col sm:flex-row gap-4 mt-6">
					<Link viewTransition prefetch="intent" to={"/"}>
						<Button variant="outline" className="w-full sm:w-auto">
							Back to Home
						</Button>
					</Link>
					<Button className="w-full sm:w-auto" onClick={() => window.location.reload()}>
						Try Again
					</Button>
				</div>
			</div>
		</div>
	);
}

function PaymentPage() {
	let loaderData = useLoaderData<typeof loader>();
	const booking_ref = loaderData?.booking_ref || "";
	const initialClientSecret = loaderData?.client_secret || null;

	const stripe = useStripe();
	const elements = useElements();
	const [thankYouOpen, setThankYouOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!stripe) {
			console.log("Stripe.js not loaded yet...");
		}
	}, [stripe]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements || !initialClientSecret) {
			toast.error("Payment not ready");
			return;
		}

		setIsSubmitting(true);
		const stripeSvc = new StripeClientService();

		const error = await stripeSvc.confirmPayment({
			elements,
			return_url: window.location.origin,
			stripe_instance: stripe,
		});

		setIsSubmitting(false);

		if (error) {
			toast.error(error.message ?? "Payment failed");
			return;
		}

		toast.success("Payment successful! Booking placed successfully.");
		setThankYouOpen(true);
	};

	// ── Loading state (while Stripe or client_secret is preparing) ──
	if (!stripe || !initialClientSecret) {
		return (
			<div className={"max-w-xl mx-auto mt-16 p-8 bg-card rounded-xl shadow-md text-center"}>
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<h1 className="text-2xl font-bold">Preparing Payment</h1>
					<p className="text-muted-foreground">
						Loading secure payment session for booking #{booking_ref}. Please wait...
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<MetaDetails
				metaTitle={"Complete Payment #" + booking_ref + " | WanderNest"}
				metaDescription={"Complete your payment for booking reference " + booking_ref}
				metaKeywords="WanderNest"
			/>
			<div className="max-w-xl mx-auto mb-5 p-8 bg-card rounded-xl shadow-md">
				<h1 className="text-2xl font-bold text-center mb-2">Complete Payment</h1>
				<p className="text-center text-muted-foreground mb-8">#{booking_ref}</p>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="rounded-md">
						<Suspense fallback={<Skeleton className="w-full h-20" />}>
							<PaymentElement options={{ business: { name: "WanderNest" } }} />
						</Suspense>
					</div>

					<Button type="submit" className="w-full" disabled={!stripe || !elements || isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin mr-2" />
								Processing...
							</>
						) : (
							"Pay Now"
						)}
					</Button>
				</form>

				{process.env.VITE_ENV === "development" && (
					<div className="text-xs text-muted-foreground mt-6 space-y-2 border-t pt-4">
						<p className="font-medium">Test cards (successful):</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>Visa: 4242 4242 4242 4242</li>
							<li>Union Pay: 6205500000000000004</li>
						</ul>
						<p>For declines/errors → check Stripe docs</p>
					</div>
				)}
			</div>
			<ThankYouDialog open={thankYouOpen} setOpen={() => setThankYouOpen(false)} />
		</>
	);
}

export default function PaymentPageWrapper() {
	const loaderData = useLoaderData<typeof loader>();
	const client_secret = loaderData?.client_secret;

	if (!client_secret) {
		// Fallback if loader somehow didn't throw but no secret
		return (
			<div className="max-w-xl mx-auto mt-16 p-8 bg-card rounded-xl shadow-md text-center">
				<div className="flex flex-col items-center gap-4">
					<ServerCrash className="h-10 w-10 text-destructive" />
					<div className="space-y-2">
						<h1 className="text-2xl font-bold">Payment Session Expired</h1>
						<p className="text-muted-foreground">
							This payment link is no longer valid or the booking is already paid.
						</p>
					</div>
					<Link to={"/"} viewTransition prefetch="intent">
						<Button className="mt-6">Back to Home</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<Elements stripe={stripePromise} options={{ clientSecret: client_secret }}>
			<PaymentPage />
		</Elements>
	);
}

const ThankYouDialog = memo(({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-137.5" showCloseButton={true}>
				<DialogHeader>
					<DialogTitle>Thank you for booking with us! 🎉</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 text-center">
					<CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
					<p className="text-lg">Your order has been successfully processed.</p>
					<p>We appreciate your business and look forward to serving you again in the future.</p>
					<p>
						If you have any questions, please contact us at{" "}
						<a
							href="mailto:wandernest@gmail.com"
							className="text-primary hover:underline"
						>
							wandernest@gmail.com
						</a>
						.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
});
