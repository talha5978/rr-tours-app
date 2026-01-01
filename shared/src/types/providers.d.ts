import type { Database } from "@workspace/shared/types/supabase";

export type GetAllProviders = Database["public"]["Tables"]["activity_providers"]["Row"][];
