import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { GetAllProviders } from "@workspace/shared/types/providers";

@UseClassMiddleware(loggerMiddleware)
export class TourProvidersService extends Service {
	/** Get All Activity PRoviders */
	async getAllTourProviders(): Promise<GetAllProviders> {
		const { data, error } = await this.supabase
			.from(this.PROVIDERS_TABLE)
			.select("id, name")
			.limit(100)
			.order("id", { ascending: false });

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}
}
