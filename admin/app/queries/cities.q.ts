import { cacheService } from "@workspace/shared/services/cache.service";
import { CityService } from "@workspace/shared/services/cities.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const highLevelCitiesQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CityService(request);
		const resp = await svc.getHighLevelCities();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.cities.highLevel("AD"), queryFn, 86400);
	return result;
};

export const cityDetailsUpdateQuery = async ({ request, cityId }: { request: Request; cityId: number }) => {
	const queryFn = async () => {
		const svc = new CityService(request);
		const resp = await svc.getCityDetailsForUpdate(cityId);
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.cities.details("AD", cityId), queryFn, 86400);
	return result;
};

export const citiesListQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new CityService(request);
		const resp = await svc.getCitiesList();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.cities.list(), queryFn, 86400);
	return result;
};
