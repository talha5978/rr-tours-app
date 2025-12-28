import { queryOptions } from "@tanstack/react-query";
import { CityService } from "@workspace/shared/services/cities.service";
import type {
	GetCityDetailsForUpdateResponse,
	GetHighLevelCitiesResponse,
} from "@workspace/shared/types/cities";

export const highLevelCitiesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetHighLevelCitiesResponse>({
		queryKey: ["highLvlCities"],
		queryFn: async () => {
			const svc = new CityService(request);
			const result = await svc.getHighLevelCities();
			return result;
		},
	});
};

export const cityDetailsUpdateQuery = (request: Request, cityId: number) => {
	return queryOptions<GetCityDetailsForUpdateResponse>({
		queryKey: ["cityDetailsForUpdate", cityId],
		queryFn: async () => {
			const svc = new CityService(request);
			const result = await svc.getCityDetailsForUpdate(cityId);
			return result;
		},
	});
};
