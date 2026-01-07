import type { MetaDetailsRow } from "@workspace/shared/types/meta_details";
import { Database } from "@workspace/shared/types/supabase";
import { ApiError } from "@workspace/shared/utils/ApiError";

export type HighLevelCategory = {
	id: number;
	name: string;
	image: string;
	url_key: string;
	tours: number;
	created_at: string | null;
};

export type GetHighLevelCategoriesResponse = {
	data: HighLevelCategory[];
	total: number;
	error: ApiError | null;
};

export type CategoryDetailsForUpdate = {
	id: number;
	name: string;
	image: string | null;
	sort_order: number;
	meta_details: MetaDetailsRow;
};

export type GetCategoryDetailsForUpdateResponse = {
	data: CategoryDetailsForUpdate | null;
	error: ApiError | null;
};

export type CategoryUpdationPayload = Database["public"]["Tables"]["tours_categories"]["Update"];

export type GetCategoryList = {
	id: number;
	name: string;
}[];

export type FPHighLevelCategory = {
	id: number;
	name: string;
	image: string;
	url_key: string;
};

export type GetFPHighLevelCategories = {
	data: FPHighLevelCategory[];
	error: ApiError | null;
};
