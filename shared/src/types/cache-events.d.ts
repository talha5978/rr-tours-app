import type { Database } from "@workspace/shared/types/supabase";

export type CacheEventInsertPayload = Database["public"]["Tables"]["cache_invalidation_events"]["Insert"];
export type CacheEvent = Database["public"]["Tables"]["cache_invalidation_events"]["Row"];
export type CacheTarget = Database["public"]["Enums"]["cache_invalidation_target"];
