import { redis } from "@workspace/shared/utils/redis";

type Fetcher<T> = () => Promise<T>;

/**
 * @description Service for manipulating data in Redis.
 */
export class cacheService {
	/**
	 * Automatically gets data from Redis or fetches from DB on miss.
	 * @param key The unique identifier for this data
	 * @param fetcher The async DB query function
	 * @param ttl Seconds until expiration (Default: 2 hours/7200 seconds)
	 */
	static async get<T>(key: string, fetcher: Fetcher<T>, ttl: number = 7200): Promise<T> {
		const cached = await redis.get(key);

		if (cached) {
			try {
				// Return parsed JSON data
				return JSON.parse(cached) as T;
			} catch (e: any) {
				console.error("CACHE SERVICE ERROR: ", e);
				// Fallback for plain strings
				return cached as unknown as T;
			}
		}

		console.log("🌸 Cache Missed for KEY: ", key);

		// Cache Miss: Run the DB query
		const freshData = await fetcher();

		if (freshData !== undefined && freshData !== null) {
			await redis.set(key, JSON.stringify(freshData), {
				expiration: {
					type: "EX",
					value: ttl,
				},
			});
		}

		return freshData;
	}

	/**
	 * Deletes a specific key (Manual Invalidation)
	 * @param key The unique identifier for this data
	 * @param retries Number of times to try before giving up (default: 3)
	 * @param delay How long to wait between retries in ms
	 */
	static async invalidate(key: string, retries = 3, delay = 500): Promise<void> {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				await redis.del(key);
				return;
			} catch (e) {
				console.error(
					`❌ CACHE INVALIDATION ERROR for key: ${key} (Attempt ${attempt}/${retries}):`,
					e,
				);

				if (attempt === retries) {
					console.error(`🚨 Final failure to invalidate key: ${key}`);
					return;
				}

				await sleep(attempt * delay);
			}
		}
	}

	/**
	 * Deletes keys based on a pattern (e.g., "user:123:*")
	 * @param pattern The pattern to match keys against
	 * @param retries Number of times to try before giving up (default: 3)
	 * @param delay How long to wait between retries in ms
	 */
	static async invalidatePattern(pattern: string, retries = 3, delay = 500): Promise<void> {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const keys = await redis.keys(pattern);
				if (keys.length > 0) {
					await redis.del(keys);
				}
				return;
			} catch (e) {
				console.error(`❌ CACHE PATTERN ERROR (Attempt ${attempt}/${retries}):`, e);
				if (attempt === retries) return;
				await sleep(attempt * delay);
			}
		}
	}
}

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
