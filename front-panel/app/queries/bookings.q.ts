import { queryOptions } from "@tanstack/react-query";
import { BookingService } from "@workspace/shared/services/booking.service";
import type { FPBookingByRefDetail, FrontPanelBookings } from "@workspace/shared/types/booking";

export const bookingByRefQuery = ({ request, ref }: { request: Request; ref: string }) => {
	return queryOptions<FPBookingByRefDetail>({
		queryKey: ["fp_booking", ref],
		queryFn: async () => {
			if (ref == null) return null;

			const svc = new BookingService(request);
			const result = await svc.getBookingByRef(ref);
			return result;
		},
		enabled: !!ref,
		staleTime: 2 * 60 * 1000,
		gcTime: 2 * 60 * 1000,
	});
};

export const myBookingsQuery = ({
	request,
	userId,
	pageIndex,
	pageSize,
}: {
	request: Request;
	userId: string;
	pageIndex: number;
	pageSize: number;
}) => {
	return queryOptions<FrontPanelBookings>({
		queryKey: ["my_bookings", pageIndex, pageSize, userId],
		queryFn: async () => {
			const svc = new BookingService(request);
			const result = await svc.getMyBookings(userId, pageIndex, pageSize);
			return result;
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 2 * 60 * 1000,
	});
};
