import { ApiError } from "@workspace/shared/utils/ApiError";

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
