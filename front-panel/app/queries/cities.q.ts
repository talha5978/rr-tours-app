import { queryOptions } from "@tanstack/react-query";
import { CityService } from "@workspace/shared/services/cities.service";
import type { GetFPCityDetailResponse, GetFPHighLevelCitiesResponse } from "@workspace/shared/types/cities";

export const FPhighLevelCitiesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetFPHighLevelCitiesResponse>({
		queryKey: ["FP_highLvlCities"],
		queryFn: async () => {
			const svc = new CityService(request);
			const result = await svc.getFPHighLevelCities();
			return result;
		},
	});
};

export const cityRelatedTagsQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetFPHighLevelCitiesResponse>({
		queryKey: ["FP_highLvlCities"],
		queryFn: async () => {
			const svc = new CityService(request);
			const result = await svc.getFPHighLevelCities();
			return result;
		},
	});
};

export const cityDetailsQuery = (request: Request, cityId: number) => {
	return queryOptions<GetFPCityDetailResponse>({
		queryKey: ["FP_cityDetails", `${cityId}`],
		queryFn: async () => {
			const svc = new CityService(request);
			const result = await svc.getCityDetailsFrontPanel(cityId);
			return result;
		},
	});
};
