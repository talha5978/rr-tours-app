import { queryOptions } from "@tanstack/react-query";
import { CheckoutService } from "@workspace/shared/services/checkout.service";

export const resumePaymentQuery = ({ request, booking_ref }: { request: Request; booking_ref: string }) => {
	return queryOptions<
		Promise<{
			clientSecret: string | null;
			paymentIntentId: string | null;
		}>
	>({
		queryKey: ["resume_payment", booking_ref],
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
		queryFn: async () => {
			const checkoutSvc = new CheckoutService(request);
			const result = await checkoutSvc.resumePaymentForBooking(booking_ref);
			return result;
		},
	});
};
