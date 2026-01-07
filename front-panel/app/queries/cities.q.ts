import { queryOptions } from "@tanstack/react-query";
import { CityService } from "@workspace/shared/services/cities.service";
import type { GetFPHighLevelCitiesResponse } from "@workspace/shared/types/cities";

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
