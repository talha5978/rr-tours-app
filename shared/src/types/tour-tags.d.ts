import type { Database } from "@workspace/shared/types/supabase";

export type GetAllTourTags = Database["public"]["Tables"]["tour_tags"]["Row"][];
