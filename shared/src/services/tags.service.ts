import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { GetAllTourTags } from "@workspace/shared/types/tour-tags";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<TourTagsService>(verifyUser))
export class TourTagsService extends Service {
	/** Get All Participant Types */
	async getAllTags(): Promise<GetAllTourTags> {
		const { data, error } = await this.supabase
			.from(this.TOUR_TAGS_TABLE)
			.select("id, name, image")
			.limit(100);

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}
}
