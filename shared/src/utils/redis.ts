import { createClient } from "redis";
import type { RedisClientType } from "redis";

declare global {
	var __redis_instance: RedisClientType | undefined;
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const IS_PROD = process.env.NODE_ENV === "production" || process.env.VITE_ENV === "production";
let redis: RedisClientType;

if (IS_PROD) {
	redis = createClient({
		url: REDIS_URL,
		name: `rr-app:${process.env.NODE_ENV}:${Math.random().toString(36).substring(7)}`,
		pingInterval: 45000,
		socket: {
			reconnectStrategy: (retries) => {
				const delay = Math.min(retries * 100, 3000);
				return retries > 20 ? new Error("Max retries reached") : delay;
			},
		},
	});
} else {
	if (!global.__redis_instance) {
		global.__redis_instance = createClient({
			url: REDIS_URL,
			name: `rr-app:${process.env.NODE_ENV}:${Math.random().toString(36).substring(7)}`,
			pingInterval: 45000,
			socket: {
				reconnectStrategy: (retries) => {
					const delay = Math.min(retries * 100, 3000);
					return retries > 20 ? new Error("Max retries reached") : delay;
				},
			},
		});
	}
	redis = global.__redis_instance;
}

// Single connection trigger
if (!redis.isOpen) {
	redis.connect().catch((err) => console.error("❌ Redis Connect Error:", err));
}

redis.on("error", (err) => console.error("❌ Redis Client Error", err));
redis.on("ready", () => console.log(`✅ Redis Connected: ${redis.options?.name}`));

const closeRedis = async () => {
	if (redis.isOpen) {
		console.log("🔌 Closing Redis...");
		await redis.quit();
	}
};

// CRITICAL: Handle the process exiting
process.once("SIGINT", closeRedis);
process.once("SIGTERM", closeRedis);

export { redis };
