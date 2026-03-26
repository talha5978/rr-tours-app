import { BookingService } from "@workspace/shared/services/booking.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const highLevelBookingsQuery = async ({
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
	const queryFn = async () => {
		const svc = new BookingService(request);
		const resp = await svc.getHighLevelBookings(q, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.bookings.highLevel(q, pageIndex, pageSize),
		queryFn,
		0.25 * 60 * 60,
	);
	return result;
};

export const getBookingDetailById = async ({ request, id }: { request: Request; id: string }) => {
	const queryFn = async () => {
		const svc = new BookingService(request);
		const resp = await svc.getBookingById(id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.bookings.details("AD", id), queryFn, 0.25 * 60 * 60);
	return result;
};

export const getBookingForConfirmation = async ({ request, id }: { request: Request; id: string }) => {
	const queryFn = async () => {
		const svc = new BookingService(request);
		const resp = await svc.getBookingForConfirmation(id);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.bookings.forConfirmation(id), queryFn, 0.25 * 60 * 60);
	return result;
};
