import { queryOptions } from "@tanstack/react-query";
import { ReviewsService } from "@workspace/shared/services/reviews.service";
import { GetTourReviewsOptions, GetTourReviewsResp } from "@workspace/shared/types/tour-reviews";

export const checkIfReviewAllowedQuery = ({ request, tour_id }: { request: Request; tour_id: string }) => {
	return queryOptions<boolean>({
		queryKey: ["check_if_review_allowed", `${tour_id}`],
		queryFn: async () => {
			const svc = new ReviewsService(request);
			const result = await svc.isAddingReviewAvailable(tour_id);
			return result;
		},
	});
};

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
