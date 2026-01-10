import { queryOptions } from "@tanstack/react-query";
import { BookingService } from "@workspace/shared/services/booking.service";
import type { FPBookingByRefDetail } from "@workspace/shared/types/booking";

export const bookingByRefQuery = ({ request, ref }: { request: Request; ref: string | null }) => {
	return queryOptions<FPBookingByRefDetail>({
		queryKey: ["fp_booking", ref],
		queryFn: async () => {
			if (ref == null) return null;

			const svc = new BookingService(request);
			const result = await svc.getBookingByRef(ref);
			return result;
		},
		enabled: !!ref,
	});
};
