import { cacheService } from "@workspace/shared/services/cache.service";
import { ReviewsService } from "@workspace/shared/services/reviews.service";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import type { ActionFunctionArgs } from "react-router";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		const data = {
			tour_id: formData.get("tour_id") as string,
			review_id: formData.get("review_id") as string,
		};

		const { authId } = genAuthSecurity(request);
		if (!authId) {
			return { action: "DELETE_REVIEW", error: "Unauthorized" };
		}

		if (!data.review_id) {
			return { action: "DELETE_REVIEW", error: "Review id are required." };
		}

		const userData = await getCurrentUser(request);
		if (!userData || !userData.user) {
			return { action: "DELETE_REVIEW", error: "Unauthorized" };
		}

		const review_svc = new ReviewsService(request);
		await review_svc.deleteReview(Number(data.review_id));

		await cacheService.invalidatePattern(CACHE_KEYS.reviews.tour(data.tour_id) + ":*");
		await cacheService.invalidate(CACHE_KEYS.reviews.home());
		await cacheService.invalidatePattern(CACHE_KEYS.reviews.my_reviews(userData.user.id) + ":*");

		return { success: true, action: "DELETE_REVIEW" };
	} catch (err: any) {
		return {
			action: "DELETE_REVIEW",
			error: err.message || "An error occurred while deleting the review.",
		};
	}
};
