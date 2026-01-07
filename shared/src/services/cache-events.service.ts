import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { Service } from "@workspace/shared/services/service.base";
import type { CacheEvent, CacheEventInsertPayload, CacheTarget } from "@workspace/shared/types/cache-events";
import { ApiError } from "@workspace/shared/utils/ApiError";

@UseClassMiddleware(loggerMiddleware)
export class CacheInvalidationService extends Service {
	/** Add cache invalidation event */
	async pushCacheInvalidationEvent(payload: CacheEventInsertPayload): Promise<void> {
		const { keys, target } = payload;

		if (keys == null || target == null) {
			throw new ApiError("Invalid payload", 400, []);
		}

		const { error } = await this.supabase.from(this.CACHE_EVENTS_TABLE).insert({ keys, target });

		if (error) {
			throw new ApiError(error.message, Number(error.code) ?? 500, [error.details]);
		}
	}

	/** Mark a cache invalidation event as processed */
	async markEventsAsProcessed(eventIds: string[]): Promise<void> {
		if (eventIds == null || eventIds.length == 0) {
			throw new ApiError("Invalid payload", 400, []);
		}

		const { error } = await this.supabase
			.from(this.CACHE_EVENTS_TABLE)
			.update({ processed: true })
			.in("id", eventIds);

		if (error) {
			throw new ApiError(error.message, Number(error.code) ?? 500, [error.details]);
		}
	}

	/** Get all cache invalidation events */
	async getCacheInvalidationEvents(target: CacheTarget = "both"): Promise<CacheEvent[]> {
		const { data, error } = await this.supabase
			.from(this.CACHE_EVENTS_TABLE)
			.select("*")
			.eq("processed", false)
			.eq("target", target)
			.limit(100)
			.order("created_at", { ascending: false });

		if (error) {
			throw new ApiError(error.message, Number(error.code) ?? 500, [error.details]);
		}

		return data ?? [];
	}
}
