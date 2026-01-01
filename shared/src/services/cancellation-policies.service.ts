import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { GetAllCancellationPolicies } from "@workspace/shared/types/cancellation-policies";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<CancellationPoliciesService>(verifyUser))
export class CancellationPoliciesService extends Service {
	/** Get All Cancellation Policies */
	async getCancellationPolicies(): Promise<GetAllCancellationPolicies> {
		const { data, error } = await this.supabase
			.from(this.CANCELLATION_POLICIES_TABLE)
			.select("*")
			.order("id", { ascending: false });

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}
}
