import type { MetaDetailsRow } from "@workspace/shared/types/meta_details";
import { Database } from "@workspace/shared/types/supabase";
import { ApiError } from "@workspace/shared/utils/ApiError";

export type HighLevelCity = {
	id: number;
	name: string;
	card_image: string;
	url_key: string;
	tours: number;
	created_at: string | null;
};

export type GetHighLevelCitiesResponse = {
	data: HighLevelCity[];
	total: number;
	error: ApiError | null;
};

export type CityDetailsForUpdate = {
	id: number;
	name: string;
	card_image: string | null;
	full_image: string | null;
	meta_details: MetaDetailsRow;
};

export type GetCityDetailsForUpdateResponse = {
	data: CityDetailsForUpdate | null;
	error: ApiError | null;
};

export type CityUpdationPayload = Database["public"]["Tables"]["cities"]["Update"];

export type GetCityList = {
	id: number;
	name: string;
}[];

export type FPHighLevelCity = {
	id: number;
	name: string;
	card_image: string;
	url_key: string;
};

export type GetFPHighLevelCitiesResponse = {
	data: FPHighLevelCity[];
	error: ApiError | null;
};

export type FPCityDetail = {
	id: number;
	name: string;
	card_image: string | null;
	full_image: string | null;
	meta_details: MetaDetailsRow;
};

export type GetFPCityDetailResponse = {
	data: FPCityDetail | null;
	error: ApiError | null;
};
