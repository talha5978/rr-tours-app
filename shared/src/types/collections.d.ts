import type { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import { type Database } from "@workspace/shared/types/supabase";
import type { ApiError } from "@workspace/shared/utils/ApiError";

export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

export type HighLevelCollection = {
	id: number;
	name: string;
	isFeatured: boolean;
	no_of_tours: number;
	cities: { id: number; name: string }[];
	created_at: string | null;
};

export type HighLevelCollectionsResp = {
	collections: HighLevelCollection[];
	total: number;
	error: ApiError | null;
};

export type CollectionDetails = {
	id: number;
	name: string;
	description: string | null;
	isFeatured: boolean;
	cities: { id: number; name: string }[];
	tours: { id: string; name: string }[];
	created_at: string | null;
};

export type CollectionDetailsResp = {
	data: CollectionDetails | null;
	error: ApiError | null;
};

export type FPCollection = {
	id: number;
	name: string;
	description: string | null;
	isFeatured: boolean;
	cities?: number[];
	tours: FP_HighLevelTour[];
};

export type GetFpCollectionsResponse = {
	collections: FPCollection[];
	total: number;
	error: ApiError | null;
};
