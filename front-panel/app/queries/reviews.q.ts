import { queryOptions } from "@tanstack/react-query";
import { ReviewsService } from "@workspace/shared/services/reviews.service";
import type {
	GetTourReviewsOptions,
	GetTourReviewsResp,
	HomePageReviewsResp,
	MyReviewsBookings,
} from "@workspace/shared/types/tour-reviews";

export const tourReviewsQuery = ({
	request,
	tour_id,
	options,
}: {
	request: Request;
	tour_id: string;
	options: GetTourReviewsOptions;
}) => {
	return queryOptions<GetTourReviewsResp>({
		queryKey: ["tour_reviews", tour_id, options],
		queryFn: async () => {
			const svc = new ReviewsService(request);
			const result = await svc.getTourReviews(tour_id, options);
			return result;
		},
	});
};

export const homeTourReviewsQuery = ({ request }: { request: Request }) => {
	return queryOptions<HomePageReviewsResp>({
		queryKey: ["home_tour_reviews"],
		queryFn: async () => {
			const svc = new ReviewsService(request);
			const result = await svc.getHomeTourReviews();
			return result;
		},
	});
};

export const myReviewsQuery = ({
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
	return queryOptions<MyReviewsBookings>({
		queryKey: ["my_reviews", userId, pageIndex, pageSize],
		queryFn: async () => {
			const svc = new ReviewsService(request);
			const result = await svc.getMyReviewBookings(userId, pageIndex, pageSize);
			return result;
		},
	});
};
