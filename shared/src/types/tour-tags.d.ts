import type { Database } from "@workspace/shared/types/supabase";

export type GetTag = Database["public"]["Tables"]["tour_tags"]["Row"];
export type GetAllTourTags = Database["public"]["Tables"]["tour_tags"]["Row"][];

export type TagUpdationPayload = Database["public"]["Tables"]["tour_tags"]["Update"];
