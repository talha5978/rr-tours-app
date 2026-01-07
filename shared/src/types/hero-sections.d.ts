import type { Database } from "@workspace/shared/types/supabase";

export type GetHeroSection = Database["public"]["Tables"]["hero_sections"]["Row"];
export type GetAllHeroSections = Database["public"]["Tables"]["hero_sections"]["Row"][];

export type HeroSectionUpdationPayload = Database["public"]["Tables"]["hero_sections"]["Update"];
