import { queryOptions } from "@tanstack/react-query";
import { BookingService } from "@workspace/shared/services/booking.service";
import type { GetBookingDetailByID, GetHighLevelBookings } from "@workspace/shared/types/booking";

export const highLevelBookingsQuery = ({
	request,
	q,
	pageIndex,
	pageSize,
}: {
	request: Request;
	q?: string;
	pageIndex?: number;
	pageSize?: number;
}) => {
	return queryOptions<GetHighLevelBookings>({
		queryKey: ["high_level_bookings", q, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new BookingService(request);
			const result = await svc.getHighLevelBookings(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const getBookingDetailById = ({ request, id }: { request: Request; id: string }) => {
	return queryOptions<GetBookingDetailByID>({
		queryKey: ["booking", id],
		queryFn: async () => {
			const svc = new BookingService(request);
			const result = await svc.getBookingById(id);
			return result;
		},
	});
};
