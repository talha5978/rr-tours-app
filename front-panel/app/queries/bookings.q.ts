import { BookingService } from "@workspace/shared/services/booking.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const bookingByRefQuery = async ({ request, ref }: { request: Request; ref: string }) => {
	if (ref == null) return null;

	const queryFn = async () => {
		const svc = new BookingService(request);
		const resp = await svc.getBookingByRef(ref);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.bookings.details("FP", ref), queryFn);
	return result;
};

export const myBookingsQuery = async ({
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
	const queryFn = async () => {
		const svc = new BookingService(request);
		const resp = await svc.getMyBookings(userId, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.bookings.user_bookings(userId, pageIndex, pageSize),
		queryFn,
	);
	return result;
};
