import { ReviewsService } from "@workspace/shared/services/reviews.service";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { queryClient } from "@workspace/shared/utils/query-client";
import type { ActionFunctionArgs } from "react-router";
import { currentFullUserQuery } from "~/queries/auth.q";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		const data = {
			rating: formData.get("rating") as string,
			comment: formData.get("comment") as string,
			tour_id: formData.get("tour_id") as string,
			booking_id: formData.get("booking_id") as string,
		};

		const { authId, headers } = genAuthSecurity(request);
		if (!authId) {
			return { error: "Unauthorized" };
		}

		if (!data.rating || !data.comment || !data.tour_id || !data.booking_id) {
			return { error: "All fields are required." };
		}

		const userData = await queryClient.fetchQuery(currentFullUserQuery({ request, authId, headers }));
		if (!userData || !userData.user) {
			return { error: "Unauthorized" };
		}

		const review_svc = new ReviewsService(request);
		await review_svc.addReview(
			data.tour_id as string,
			data.booking_id as string,
			Number(data.rating),
			String(data.comment),
			userData.user.id,
		);

		await queryClient.invalidateQueries({ queryKey: ["tour_reviews", data.tour_id] });
		await queryClient.invalidateQueries({ queryKey: ["home_tour_reviews"] });
		await queryClient.invalidateQueries({ queryKey: ["my_reviews", userData.user.id] });

		return { success: true };
	} catch (err: any) {
		return { error: err.message || "An error occurred while adding the review." };
	}
};
