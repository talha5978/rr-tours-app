import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { GetAllParticipantTypes } from "@workspace/shared/types/participant-types";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ParticipantTypesService>(verifyUser))
export class ParticipantTypesService extends Service {
	/** Get All Participant Types */
	async getParticipantTypes(): Promise<GetAllParticipantTypes> {
		const { data, error } = await this.supabase
			.from(this.PARTICIPANT_TYPES_TABLE)
			.select("id, name, age_max, age_min")
			.order("created_at", { ascending: false });

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}
}
