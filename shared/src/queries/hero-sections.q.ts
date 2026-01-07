import { queryOptions } from "@tanstack/react-query";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
import type { GetAllHeroSections } from "@workspace/shared/types/hero-sections";

export const allHeroSectionsQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllHeroSections>({
		queryKey: ["hero_sections"],
		queryFn: async () => {
			const svc = new HeroSectionsService(request);
			const result = await svc.getAllHeroSections();
			return result;
		},
	});
};
