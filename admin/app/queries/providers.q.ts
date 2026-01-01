import { queryOptions } from "@tanstack/react-query";
import { TourProvidersService } from "@workspace/shared/services/providers.service";
import type { GetAllProviders } from "@workspace/shared/types/providers";

export const allProvidersQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllProviders>({
		queryKey: ["allProviders"],
		queryFn: async () => {
			const svc = new TourProvidersService(request);
			const result = await svc.getAllTourProviders();
			return result;
		},
	});
};
