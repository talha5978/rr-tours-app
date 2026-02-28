import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { memo, Suspense, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { StripeClientService } from "@workspace/shared/services/stripe.service";
import { MetaDetails } from "~/components/SEO/MetaDetails";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const loader = ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const booking_ref = url.searchParams.get("booking_ref");
	const client_secret = url.searchParams.get("client_secret");

	if (!booking_ref || !client_secret) {
		throw new Response("Missing booking_ref or client_secret", { status: 400 });
	}

	return { booking_ref, client_secret };
};

function PaymentPage() {
	const { client_secret: _, booking_ref } = useLoaderData<typeof loader>();
	const stripe = useStripe();
	const elements = useElements();
	const navigate = useNavigate();
	const [thankYouOpen, setThankYouOpen] = useState(false);
	const [isSubmitting, setSubmittion] = useState(false);

	useEffect(() => {
		if (!stripe) {
			console.log("Stripe.js not loaded yet...");
		}
	}, [stripe]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			toast.error("Stripe not loaded");
			return;
		}

		setSubmittion(true);

		const stripeSvc = new StripeClientService();

		const error = await stripeSvc.confirmPayment({
			elements,
			return_url: window.location.origin,
			stripe_instance: stripe,
		});

		setSubmittion(false);

		if (error) {
			toast.error(error.message ?? "Payment failed");
			return;
		}

		toast.success("Payment successful! Booking placed successfully.");

		setThankYouOpen(true);
		// navigate("/");
	};

	return (
		<>
			<MetaDetails
				metaTitle={"Complete Payment #" + booking_ref + " | Top Attractions Dubai"}
				metaDescription={"Complete your payment for booking reference " + booking_ref}
				metaKeywords="Top Attractions Dubai"
			/>
			<div className="max-w-xl mx-auto mb-5 p-8 bg-card rounded-xl shadow-md">
				<h1 className="text-2xl font-bold text-center mb-2">Complete Payment</h1>
				<p className="text-center text-muted-foreground mb-8">#{booking_ref}</p>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="rounded-md">
						<Suspense fallback={<Skeleton className="w-full h-20" />}>
							<PaymentElement options={{ business: { name: "Top Attractions Dubai" } }} />
						</Suspense>
					</div>

					<Button type="submit" className="w-full" disabled={!stripe || !elements || isSubmitting}>
						{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						{!stripe ? "Loading Stripe..." : "Pay Now"}
					</Button>
				</form>
				{process.env.VITE_ENV === "development" && (
					<div className="text-xs text-muted-foreground mt-4 space-y-1">
						<p>Test cards (successful):</p>
						<ul className="list-disc pl-5">
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

// This wrapper provides Elements context
export default function PaymentPageWrapper() {
	const { client_secret } = useLoaderData<typeof loader>();

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
				<div>
					<p>
						Your order has been successfully processed. We appreciate your business and look
						forward to serving you again in the future.
					</p>
					<p>
						If you have any questions or concerns, please don't hesitate to contact us at{" "}
						<a href="mailto:support@example.com">support@example.com</a>.
					</p>
					<p>We hope you enjoy your purchase!</p>
				</div>
			</DialogContent>
		</Dialog>
	);
});
