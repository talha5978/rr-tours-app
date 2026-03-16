import { queryOptions } from "@tanstack/react-query";
import { BookingService } from "@workspace/shared/services/booking.service";
import type {
	GetBookingDetailByID,
	GetBookingDetailsForConfirm,
	GetHighLevelBookings,
} from "@workspace/shared/types/booking";

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
		staleTime: 5 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
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
		staleTime: 5 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

export const getBookingForConfirmation = ({ request, id }: { request: Request; id: string }) => {
	return queryOptions<GetBookingDetailsForConfirm>({
		queryKey: ["booking_for_confirmation", id],
		queryFn: async () => {
			const svc = new BookingService(request);
			const result = await svc.getBookingForConfirmation(id);
			return result;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};
