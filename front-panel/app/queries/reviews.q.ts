import { cacheService } from "@workspace/shared/services/cache.service";
import { ReviewsService } from "@workspace/shared/services/reviews.service";
import type { GetTourReviewsOptions } from "@workspace/shared/types/tour-reviews";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const tourReviewsQuery = async ({
	request,
	tour_id,
	options,
}: {
	request: Request;
	tour_id: string;
	options: GetTourReviewsOptions;
}) => {
	const queryFn = async () => {
		const svc = new ReviewsService(request);
		const resp = await svc.getTourReviews(tour_id, options);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.reviews.tour(tour_id, options.limit, options.offset, options.filters),
		queryFn,
	);
	return result;
};

export const homeTourReviewsQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new ReviewsService(request);
		const resp = await svc.getHomeTourReviews();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.reviews.home(), queryFn);
	return result;
};

export const myReviewsQuery = async ({
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
		const svc = new ReviewsService(request);
		const resp = await svc.getMyReviewBookings(userId, pageIndex, pageSize);
		return resp;
	};

	const result = await cacheService.get(
		CACHE_KEYS.reviews.my_reviews(userId, pageIndex, pageSize),
		queryFn,
	);
	return result;
};
