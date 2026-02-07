import { ReviewsService } from "@workspace/shared/services/reviews.service";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { queryClient } from "@workspace/shared/utils/query-client";
import type { ActionFunctionArgs } from "react-router";
import { currentFullUserQuery } from "~/queries/auth.q";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		const data = {
			tour_id: formData.get("tour_id") as string,
			review_id: formData.get("review_id") as string,
		};

		const { authId, headers } = genAuthSecurity(request);
		if (!authId) {
			return { action: "DELETE_REVIEW", error: "Unauthorized" };
		}

		if (!data.review_id) {
			return { action: "DELETE_REVIEW", error: "Review id are required." };
		}

		const userData = await queryClient.fetchQuery(currentFullUserQuery({ request, authId, headers }));
		if (!userData || !userData.user) {
			return { action: "DELETE_REVIEW", error: "Unauthorized" };
		}

		const review_svc = new ReviewsService(request);
		await review_svc.deleteReview(Number(data.review_id));

		await queryClient.invalidateQueries({ queryKey: ["tour_reviews", data.tour_id] });
		await queryClient.invalidateQueries({ queryKey: ["home_tour_reviews"] });
		await queryClient.invalidateQueries({ queryKey: ["my_reviews", userData.user.id] });

		return { success: true, action: "DELETE_REVIEW" };
	} catch (err: any) {
		return {
			action: "DELETE_REVIEW",
			error: err.message || "An error occurred while deleting the review.",
		};
	}
};
